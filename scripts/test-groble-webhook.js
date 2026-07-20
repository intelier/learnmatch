// Groble 웹훅 서명·언락 흐름 검증용 (일회성 테스트 스크립트)
// 사용: node scripts/test-groble-webhook.js <share_token> [base_url]
const crypto = require('crypto');
const fs = require('fs');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const shareToken = process.argv[2];
const base = process.argv[3] || 'http://localhost:3000';
if (!shareToken) {
  console.error('사용: node scripts/test-groble-webhook.js <share_token> [base_url]');
  process.exit(1);
}

const payload = {
  id: 'evt_test_' + Date.now(),
  type: 'payment.completed',
  version: '2026-04-21',
  occurredAt: new Date().toISOString(),
  data: {
    object: {
      merchantUid: 'test_merchant_' + Date.now(),
      content: { id: 'prod_test', title: '진단1회', type: 'SERVICE' },
      pricing: { originalAmount: 990, finalAmount: 990, currency: 'KRW' },
      questionAnswers: [
        { question: '진단 결과 페이지 링크를 알려주세요', answer: `https://learnmatch-zeta.vercel.app/r/${shareToken}` },
      ],
    },
  },
};

const rawBody = JSON.stringify(payload);
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = crypto
  .createHmac('sha256', env.GROBLE_WEBHOOK_SECRET)
  .update(`${timestamp}.${rawBody}`)
  .digest('hex');

(async () => {
  console.log('== 1) 정상 서명으로 전송 ==');
  const res1 = await fetch(`${base}/api/webhooks/groble`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-groble-signature': signature,
      'x-groble-timestamp': timestamp,
    },
    body: rawBody,
  });
  console.log('status:', res1.status, await res1.text());

  console.log('\n== 2) 잘못된 서명으로 전송 (401 기대) ==');
  const res2 = await fetch(`${base}/api/webhooks/groble`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-groble-signature': 'deadbeef'.repeat(8),
      'x-groble-timestamp': timestamp,
    },
    body: rawBody,
  });
  console.log('status:', res2.status, await res2.text());

  console.log('\n== 3) 동일 서명 재전송 (재시도 시뮬레이션, already_unlocked 기대) ==');
  const res3 = await fetch(`${base}/api/webhooks/groble`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-groble-signature': signature,
      'x-groble-timestamp': timestamp,
    },
    body: rawBody,
  });
  console.log('status:', res3.status, await res3.text());
})();
