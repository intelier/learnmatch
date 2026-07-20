/**
 * Groble 결제 완료 웹훅 (T-12 자동 언락)
 *
 * 설정: Groble 대시보드 → 내 스토어 → 설정 → 웹훅
 *   URL: https://<도메인>/api/webhooks/groble
 *   이벤트: payment.completed
 *   → 발급되는 시크릿을 GROBLE_WEBHOOK_SECRET 에 저장
 *
 * 전제: 각 상품에 "구매 시 질문"으로 진단 결과 링크(/r/<code>)를
 *       필수 입력받도록 설정되어 있어야 한다 — questionAnswers에서
 *       share_token을 추출해 언락 대상을 식별한다.
 */
import { NextResponse } from 'next/server';
import { unlockByShareToken, type ProductId } from '@/lib/db';
import {
  parsePaymentCompleted,
  verifyGrobleSignature,
  type GrobleEvent,
} from '@/lib/groble-webhook';

/** 결제 금액으로 상품 매핑 (상품 ID를 직접 비교하는 것이 정확하지만, 아직 미확보) */
function resolveProduct(finalAmount: number | null): ProductId {
  if (finalAmount !== null && finalAmount >= 5000) return 'pack10_8000';
  return 'single_990';
}

export async function POST(request: Request) {
  const secret = process.env.GROBLE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('GROBLE_WEBHOOK_SECRET 미설정 — 웹훅 비활성 상태');
    return NextResponse.json({ error: 'not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const verify = verifyGrobleSignature({
    rawBody,
    signatureHeader: request.headers.get('x-groble-signature'),
    timestampHeader: request.headers.get('x-groble-timestamp'),
    secret,
  });
  if (!verify.ok) {
    console.error('Groble 웹훅 서명 검증 실패:', verify.reason);
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: GrobleEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  // payment.completed 외 이벤트는 확인만 하고 200으로 응답 (재시도 방지)
  if (event.type !== 'payment.completed') {
    return NextResponse.json({ ok: true, skipped: event.type });
  }

  const parsed = parsePaymentCompleted(event);
  if (!parsed.shareToken) {
    console.error(
      '웹훅에서 share_token을 찾지 못함 — "구매 시 질문" 설정을 확인하세요.',
      { merchantUid: parsed.merchantUid, productTitle: parsed.productTitle }
    );
    // 재시도해도 못 찾을 오류이므로 200으로 확인만 하고 운영자가 로그로 인지
    return NextResponse.json({ ok: false, error: 'share_token_not_found' });
  }

  const product = resolveProduct(parsed.finalAmount);
  const result = await unlockByShareToken({
    shareToken: parsed.shareToken,
    product,
    grobleRef: parsed.merchantUid ?? undefined,
    note: `웹훅 자동 언락 (${parsed.productTitle ?? '상품명 미상'})`,
  });

  if (!result.ok) {
    console.error('웹훅 언락 실패:', result.reason, { shareToken: parsed.shareToken });
    // share_token이 잘못 입력된 경우(not_found) 등은 재시도해도 소용없으므로 200
    return NextResponse.json({ ok: false, error: result.reason });
  }

  return NextResponse.json({
    ok: true,
    shareToken: parsed.shareToken,
    alreadyUnlocked: result.reason === 'already_unlocked',
  });
}
