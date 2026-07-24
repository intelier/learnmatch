import { NextResponse } from 'next/server';
import { saveDiagnosis } from '@/lib/db';
import { generateReport } from '@/lib/llm';
import { splitReport } from '@/lib/report-gate';
import { scoreAnswers, type Answers } from '@/lib/scoring';

export async function POST(request: Request) {
  let answers: Answers;
  let childName: string | undefined;
  try {
    const body = await request.json();
    answers = body?.answers;
    // 이름은 선택. 과도한 길이/공백 방어.
    if (typeof body?.childName === 'string') {
      const trimmed = body.childName.trim().slice(0, 20);
      if (trimmed) childName = trimmed;
    }
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  if (
    !answers ||
    typeof answers !== 'object' ||
    Object.keys(answers).length === 0
  ) {
    return NextResponse.json({ error: 'answers required' }, { status: 400 });
  }

  const scores = scoreAnswers(answers);
  if (scores.answeredCount === 0) {
    return NextResponse.json({ error: 'no valid answers' }, { status: 400 });
  }

  const report = await generateReport({ answers, scores, childName });

  // T-09: 진단·리포트 저장 (DB 미설정/실패 시 null — 무상태 동작 유지)
  const saved = await saveDiagnosis({
    answers,
    scores,
    childName,
    markdown: report.markdown,
    model: report.model,
    promptVersion: report.promptVersion,
  });

  // T-10: 신규 진단은 미결제 상태 — 잠금 구간은 응답에서 제거 (D-07 경계)
  const gated = splitReport(report.markdown);
  const locked = gated.locked !== null;
  return NextResponse.json({
    markdown: locked ? gated.free : report.markdown,
    locked,
    lockedSections: gated.lockedSections,
    model: report.model,
    promptVersion: report.promptVersion,
    shareToken: saved?.shareToken ?? null,
  });
}
