/**
 * 관리자 언락 도구 (T-12 운영용)
 *
 * 사용법:
 *   node scripts/unlock.js <share_token> [주문번호] [--local]
 *
 * 예:
 *   node scripts/unlock.js rTlqpbbD6bEM ORDER-1234       # 프로덕션 언락
 *   node scripts/unlock.js rTlqpbbD6bEM ORDER-1234 --local  # 로컬 서버 언락
 *   node scripts/unlock.js --list                        # 최근 진단 목록 보기
 *
 * ADMIN_SECRET은 .env.local에서 읽는다.
 */
const fs = require('fs');
const path = require('path');

const PROD_URL = 'https://learnmatch-zeta.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function listRecent(env) {
  const { createClient } = require('@supabase/supabase-js');
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await db
    .from('diagnoses')
    .select('share_token, unlocked, created_at')
    .order('created_at', { ascending: false })
    .limit(15);
  if (error) {
    console.error('조회 실패:', error.message);
    process.exit(1);
  }
  console.log('최근 진단 15건:\n');
  for (const d of data) {
    const when = new Date(d.created_at).toLocaleString('ko-KR');
    console.log(`  ${d.unlocked ? '🔓' : '🔒'} ${d.share_token}  ${when}`);
  }
  console.log('\n언락: node scripts/unlock.js <share_token> [주문번호]');
}

async function main() {
  const args = process.argv.slice(2);
  const env = loadEnv();

  if (args.includes('--list')) return listRecent(env);

  const isLocal = args.includes('--local');
  const positional = args.filter((a) => !a.startsWith('--'));
  const [shareToken, grobleRef] = positional;

  if (!shareToken) {
    console.error('사용법: node scripts/unlock.js <share_token> [주문번호] [--local]');
    console.error('       node scripts/unlock.js --list');
    process.exit(1);
  }
  if (!env.ADMIN_SECRET) {
    console.error('ADMIN_SECRET이 .env.local에 설정되어 있지 않습니다.');
    process.exit(1);
  }

  const base = isLocal ? LOCAL_URL : PROD_URL;
  const res = await fetch(`${base}/api/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': env.ADMIN_SECRET,
    },
    body: JSON.stringify({
      shareToken,
      product: 'single_990',
      grobleRef: grobleRef ?? null,
      note: '관리자 수동 언락',
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`실패 [${res.status}]:`, body.error ?? '알 수 없는 오류');
    if (res.status === 404 && body.error === 'not_found') {
      console.error('→ share_token을 확인하세요. (node scripts/unlock.js --list)');
    }
    if (res.status === 404 && !body.error) {
      console.error('→ 서버에 ADMIN_SECRET이 설정되지 않았을 수 있습니다.');
    }
    process.exit(1);
  }

  console.log(body.alreadyUnlocked ? '이미 언락된 진단입니다.' : '언락 완료 ✓');
  console.log(`리포트: ${base}/r/${shareToken}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
