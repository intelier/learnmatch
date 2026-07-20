/**
 * ★ Groble 판매 링크 교체 지점 (T-11)
 * PG 직접 연동 없음 — Groble(groble.im) 상품 페이지로 보내기만 한다.
 * 상품을 만든 뒤 아래 두 URL(환경변수)만 채우면 CTA가 활성화된다.
 *
 * 환경변수 (클라이언트 노출되므로 비밀 아님):
 *   NEXT_PUBLIC_GROBLE_SINGLE_URL  — 진단 1회 990원 상품
 *   NEXT_PUBLIC_GROBLE_PACK10_URL  — 10회권 8,000원 상품
 */

export const GROBLE_SINGLE_URL = process.env.NEXT_PUBLIC_GROBLE_SINGLE_URL ?? '';
export const GROBLE_PACK10_URL = process.env.NEXT_PUBLIC_GROBLE_PACK10_URL ?? '';

/** 상품 링크가 준비됐는지 (하나라도 있으면 결제 CTA 활성화) */
export function isPaymentReady(): boolean {
  return GROBLE_SINGLE_URL.length > 0;
}

/**
 * 결제 후 어느 진단을 언락할지 식별하기 위해 share_token을 쿼리로 붙인다.
 * (T-12에서 Groble 리다이렉트/웹훅으로 이 토큰을 받아 unlocked 처리)
 */
export function buildCheckoutUrl(base: string, shareToken: string | null): string {
  if (!base) return '';
  if (!shareToken) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}ref=${encodeURIComponent(shareToken)}`;
}
