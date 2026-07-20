/**
 * Groble 웹훅 서명 검증 + 페이로드 파싱 (T-12 자동 언락)
 * 가이드: https://www.groble.im/help/guides/webhook
 *         https://www.groble.im/help/guides/webhook-events
 */
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_CLOCK_SKEW_SEC = 5 * 60;

export interface VerifyResult {
  ok: boolean;
  reason?: 'missing_headers' | 'bad_timestamp' | 'signature_mismatch';
}

/** signature = HEX(HMAC-SHA256(secret, "{timestamp}.{raw_body}")) */
export function verifyGrobleSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
}): VerifyResult {
  const { rawBody, signatureHeader, timestampHeader, secret } = params;
  if (!signatureHeader || !timestampHeader) return { ok: false, reason: 'missing_headers' };

  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_timestamp' };
  const skew = Math.abs(Date.now() / 1000 - ts);
  if (skew > MAX_CLOCK_SKEW_SEC) return { ok: false, reason: 'bad_timestamp' };

  const expected = createHmac('sha256', secret).update(`${timestampHeader}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signatureHeader, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'signature_mismatch' };
  }
  return { ok: true };
}

interface GrobleQuestionAnswer {
  question?: string;
  title?: string;
  answer?: string;
  value?: string;
}

interface GrobleEvent {
  id: string;
  type: string;
  occurredAt: string;
  data: {
    object: {
      merchantUid?: string;
      content?: { id?: string; title?: string; type?: string };
      pricing?: { finalAmount?: number; currency?: string };
      questionAnswers?: GrobleQuestionAnswer[];
    };
  };
}

export interface ParsedPayment {
  shareToken: string | null;
  merchantUid: string | null;
  finalAmount: number | null;
  productTitle: string | null;
}

/** 공유 링크 형태(/r/<token>) 또는 토큰 단독 문자열에서 share_token을 추출한다. */
function extractShareToken(text: string): string | null {
  const urlMatch = text.match(/\/r\/([A-Za-z0-9]{6,})/);
  if (urlMatch) return urlMatch[1];
  const bare = text.trim();
  if (/^[A-Za-z0-9]{8,20}$/.test(bare)) return bare;
  return null;
}

export function parsePaymentCompleted(event: GrobleEvent): ParsedPayment {
  const obj = event.data?.object ?? {};
  const answers = obj.questionAnswers ?? [];
  let shareToken: string | null = null;
  for (const qa of answers) {
    const raw = qa.answer ?? qa.value ?? '';
    const found = extractShareToken(raw);
    if (found) {
      shareToken = found;
      break;
    }
  }
  return {
    shareToken,
    merchantUid: obj.merchantUid ?? null,
    finalAmount: obj.pricing?.finalAmount ?? null,
    productTitle: obj.content?.title ?? null,
  };
}

export type { GrobleEvent };
