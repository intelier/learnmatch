/**
 * ★ LLM 교체 지점 (이 파일 하나만 바꾸면 된다)
 *
 * 우선순위: Gemini (GEMINI_API_KEY) → Claude (ANTHROPIC_API_KEY) → mock
 * - D-05: Anthropic 결제 문제로 Gemini를 1순위로 사용
 * - 호출 실패/빈 응답 시 다음 어댑터로 폴백
 *
 * 프롬프트는 lib/prompt.ts, 입력 타입은 ReportInput.
 */
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { generateMockReport } from './llm-mock.ts';
import {
  buildSystemPrompt,
  buildUserPrompt,
  PROMPT_VERSION,
  type ReportInput,
} from './prompt.ts';

const GEMINI_MODEL = 'gemini-2.5-flash';
const CLAUDE_MODEL = 'claude-sonnet-5';

export interface ReportResult {
  markdown: string;
  model: string;
  promptVersion: string;
}

async function tryGemini(input: ReportInput): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildUserPrompt(input),
      config: { systemInstruction: buildSystemPrompt() },
    });
    const markdown = response.text?.trim();
    return markdown || null;
  } catch (error) {
    console.error('Gemini API 호출 실패 — 다음 어댑터로 폴백:', error);
    return null;
  }
}

async function tryClaude(input: ReportInput): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    });
    if (response.stop_reason === 'refusal') return null;
    const markdown = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    return markdown || null;
  } catch (error) {
    console.error('Claude API 호출 실패 — 다음 어댑터로 폴백:', error);
    return null;
  }
}

export async function generateReport(input: ReportInput): Promise<ReportResult> {
  const gemini = await tryGemini(input);
  if (gemini) {
    return { markdown: gemini, model: GEMINI_MODEL, promptVersion: PROMPT_VERSION };
  }

  const claude = await tryClaude(input);
  if (claude) {
    return { markdown: claude, model: CLAUDE_MODEL, promptVersion: PROMPT_VERSION };
  }

  return {
    markdown: generateMockReport(input),
    model: 'mock',
    promptVersion: PROMPT_VERSION,
  };
}
