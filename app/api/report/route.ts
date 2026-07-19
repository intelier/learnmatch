import { NextResponse } from 'next/server';
import { saveDiagnosis } from '@/lib/db';
import { generateReport } from '@/lib/llm';
import { scoreAnswers, type Answers } from '@/lib/scoring';

export async function POST(request: Request) {
  let answers: Answers;
  try {
    const body = await request.json();
    answers = body?.answers;
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

  const report = await generateReport({ answers, scores });

  // T-09: 진단·리포트 저장 (DB 미설정/실패 시 null — 무상태 동작 유지)
  const saved = await saveDiagnosis({
    answers,
    scores,
    markdown: report.markdown,
    model: report.model,
    promptVersion: report.promptVersion,
  });

  return NextResponse.json({
    markdown: report.markdown,
    model: report.model,
    promptVersion: report.promptVersion,
    shareToken: saved?.shareToken ?? null,
  });
}
