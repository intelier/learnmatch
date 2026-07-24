/**
 * Supabase 서버 전용 클라이언트 (T-09)
 * - service_role 키 사용: API 라우트/서버 컴포넌트에서만 import할 것 (클라이언트 노출 금지)
 * - 환경변수가 없으면 null 반환 → 호출부는 무상태(M1) 동작으로 폴백
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import type { Answers, Scores } from './scoring.ts';

let cached: SupabaseClient | null | undefined;

export function getDb(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  // 대시보드에서 값을 붙여넣을 때 딸려오는 공백/줄바꿈 방어
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  cached = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cached;
}

const TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** 공유용 짧은 토큰 (12자). 첫 글자는 영문으로 고정해 legacy 숫자 코드와 구분. */
export function newShareToken(): string {
  const bytes = randomBytes(12);
  let token = 'abcdefghijklmnopqrstuvwxyz'[bytes[0] % 26];
  for (let i = 1; i < 12; i++) token += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  return token;
}

export interface SavedDiagnosis {
  shareToken: string;
}

/** 진단 + 리포트 저장. 실패해도 서비스는 계속되어야 하므로 오류는 null로 삼킨다. */
export async function saveDiagnosis(params: {
  answers: Answers;
  scores: Scores;
  childName?: string;
  markdown: string;
  model: string;
  promptVersion: string;
}): Promise<SavedDiagnosis | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const shareToken = newShareToken();
    const { data: diagnosis, error: dErr } = await db
      .from('diagnoses')
      .insert({
        answers: params.answers,
        scores: params.scores,
        child_name: params.childName ?? null,
        share_token: shareToken,
      })
      .select('id')
      .single();
    if (dErr || !diagnosis) throw dErr ?? new Error('diagnosis insert 실패');

    const { error: rErr } = await db.from('reports').insert({
      diagnosis_id: diagnosis.id,
      content_md: params.markdown,
      model: params.model,
      prompt_version: params.promptVersion,
      status: 'done',
    });
    if (rErr) throw rErr;

    return { shareToken };
  } catch (error) {
    console.error('Supabase 저장 실패 (서비스는 계속 동작):', error);
    return null;
  }
}

export type ProductId = 'single_990' | 'pack10_8000';

export interface UnlockResult {
  ok: boolean;
  reason?: 'db_unavailable' | 'not_found' | 'already_unlocked' | 'error';
}

/**
 * 결제 확인된 진단을 언락하고 구매 기록을 남긴다 (T-12).
 * 호출 전에 반드시 결제 사실이 검증되어야 한다 (관리자 인증 또는 웹훅 서명).
 */
export async function unlockByShareToken(params: {
  shareToken: string;
  product: ProductId;
  grobleRef?: string;
  note?: string;
}): Promise<UnlockResult> {
  const db = getDb();
  if (!db) return { ok: false, reason: 'db_unavailable' };
  try {
    const { data: diagnosis, error: findErr } = await db
      .from('diagnoses')
      .select('id, unlocked')
      .eq('share_token', params.shareToken)
      .limit(1)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!diagnosis) return { ok: false, reason: 'not_found' };
    if (diagnosis.unlocked) return { ok: true, reason: 'already_unlocked' };

    const { error: updErr } = await db
      .from('diagnoses')
      .update({ unlocked: true })
      .eq('id', diagnosis.id);
    if (updErr) throw updErr;

    // 구매 기록은 실패해도 언락 자체는 유지 (사용자 경험 우선)
    const { error: purErr } = await db.from('purchases').insert({
      diagnosis_id: diagnosis.id,
      product: params.product,
      status: 'confirmed',
      groble_ref: params.grobleRef ?? null,
      note: params.note ?? null,
    });
    if (purErr) console.error('구매 기록 저장 실패 (언락은 완료됨):', purErr);

    return { ok: true };
  } catch (error) {
    console.error('언락 처리 실패:', error);
    return { ok: false, reason: 'error' };
  }
}

export interface SharedDiagnosis {
  answers: Answers;
  markdown: string;
  /** 결제 언락 여부 (T-10) */
  unlocked: boolean;
  /** 아이 이름 (선택) */
  childName: string | null;
}

/** share_token으로 저장된 진단+리포트 조회. 없거나 DB 미설정이면 null. */
export async function findByShareToken(token: string): Promise<SharedDiagnosis | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const { data, error } = await db
      .from('diagnoses')
      .select('answers, unlocked, child_name, reports(content_md)')
      .eq('share_token', token)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const report = Array.isArray(data.reports) ? data.reports[0] : data.reports;
    if (!report?.content_md) return null;
    return {
      answers: data.answers as Answers,
      markdown: report.content_md,
      unlocked: Boolean(data.unlocked),
      childName: (data.child_name as string | null) ?? null,
    };
  } catch (error) {
    console.error('Supabase 조회 실패:', error);
    return null;
  }
}
