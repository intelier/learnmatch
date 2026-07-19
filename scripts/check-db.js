// T-09 검증: diagnoses/reports 행 생성 확인 (개발용, .env.local 필요)
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

(async () => {
  const { data: diagnoses, error: e1 } = await db
    .from('diagnoses')
    .select('id, share_token, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  if (e1) throw e1;
  console.log('diagnoses (최신 5건):');
  for (const d of diagnoses) console.log(' ', d.share_token, d.created_at);

  const { count, error: e2 } = await db
    .from('reports')
    .select('*', { count: 'exact', head: true });
  if (e2) throw e2;
  console.log('reports 총 행 수:', count);

  const { data: joined, error: e3 } = await db
    .from('diagnoses')
    .select('share_token, reports(model, prompt_version, status)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (e3) throw e3;
  console.log('최신 진단의 리포트:', JSON.stringify(joined.reports));
})();
