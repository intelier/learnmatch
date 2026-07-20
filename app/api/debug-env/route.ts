/**
 * ⚠️ 임시 진단용 — 확인 후 삭제할 것.
 * 환경변수의 "값"은 절대 반환하지 않는다. 존재 여부·길이·형식만.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const url = process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  let dbPing: string;
  const db = getDb();
  if (!db) {
    dbPing = 'client-null (환경변수 미인식)';
  } else {
    try {
      const { error } = await db.from('diagnoses').select('id').limit(1);
      dbPing = error ? `쿼리 실패: ${error.message}` : 'OK';
    } catch (e) {
      dbPing = `예외: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({
    SUPABASE_URL: {
      present: url.length > 0,
      length: url.length,
      startsWithHttps: url.startsWith('https://'),
      endsWithSupabaseCo: url.endsWith('.supabase.co'),
      hasWhitespace: url !== url.trim(),
      containsEquals: url.includes('='),
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      present: key.length > 0,
      length: key.length,
      startsWithEyJ: key.startsWith('eyJ'),
      hasWhitespace: key !== key.trim(),
      containsEquals: key.includes('='),
    },
    dbPing,
  });
}
