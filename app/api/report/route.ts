import { NextResponse } from 'next/server';
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
  return NextResponse.json({
    markdown: report.markdown,
    model: report.model,
    promptVersion: report.promptVersion,
  });
}
