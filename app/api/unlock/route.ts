/**
 * 관리자 언락 API (T-12)
 * Groble에서 결제를 확인한 뒤 운영자가 호출한다.
 *
 * 인증: ADMIN_SECRET 환경변수와 x-admin-secret 헤더 일치 필요.
 *       ADMIN_SECRET이 없으면 엔드포인트 자체가 비활성(404 동작).
 *
 * 사용 예:
 *   curl -X POST https://<도메인>/api/unlock \
 *     -H "Content-Type: application/json" \
 *     -H "x-admin-secret: <비밀값>" \
 *     -d '{"shareToken":"abc123...","product":"single_990","grobleRef":"주문번호"}'
 */
import { NextResponse } from 'next/server';
import { unlockByShareToken, type ProductId } from '@/lib/db';

const VALID_PRODUCTS: ProductId[] = ['single_990', 'pack10_8000'];

/** 타이밍 공격 완화를 위한 상수 시간 비교 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    // 비밀값 미설정 시 기능 자체를 노출하지 않는다
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const provided = request.headers.get('x-admin-secret')?.trim() ?? '';
  if (!safeEqual(provided, secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { shareToken?: string; product?: string; grobleRef?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const shareToken = body.shareToken?.trim();
  if (!shareToken) {
    return NextResponse.json({ error: 'shareToken required' }, { status: 400 });
  }

  const product = (body.product ?? 'single_990') as ProductId;
  if (!VALID_PRODUCTS.includes(product)) {
    return NextResponse.json(
      { error: `product must be one of ${VALID_PRODUCTS.join(', ')}` },
      { status: 400 }
    );
  }

  const result = await unlockByShareToken({
    shareToken,
    product,
    grobleRef: body.grobleRef,
    note: body.note,
  });

  if (!result.ok) {
    const status = result.reason === 'not_found' ? 404 : 500;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    shareToken,
    alreadyUnlocked: result.reason === 'already_unlocked',
  });
}
