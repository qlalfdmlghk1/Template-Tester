// Claude(Anthropic) 호출 계층 — 프롬프트 구성 + JSON 파싱
// 프론트에서 직접 호출 금지, 이 Function 프록시를 통해서만 접근 (기획서 3.6.1)
import Anthropic from "@anthropic-ai/sdk";

// 경량 모델 (기획서의 claude-3-5-haiku는 은퇴 → 현행 Haiku 4.5로 대체, 비용·속도 고려)
export const MODEL = "claude-haiku-4-5";

const MAX_TOKENS_CONCEPTS = 1024;
const MAX_TOKENS_QUESTIONS = 2048;

export interface SubjectInput {
  topic: string;
  sub: string;
  detail: string;
}

export interface ConceptTarget {
  conceptId: string;
  name: string;
  correctCount: number;
  wrongCount: number;
}

export type QuestionType = "mcq" | "short";

export interface GeneratedQuestion {
  conceptId: string;
  type: QuestionType;
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
}

/** 응답 텍스트에서 코드펜스를 제거하고 JSON 파싱 */
function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

/** 단일 메시지 호출 → 응답 텍스트 반환 */
async function complete(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const textBlock = res.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI 응답에 텍스트 블록이 없습니다.");
  }
  return textBlock.text;
}

/** 세부주제 → 핵심 개념 목록 생성 (하이브리드 시딩의 AI 제안) */
export async function runRecommendConcepts(
  apiKey: string,
  subject: SubjectInput,
): Promise<string[]> {
  const system = `당신은 학습 주제에서 핵심 개념 목록을 추출하는 도우미입니다.
사용자가 지정한 세부주제 범위 안에서 반드시 공부해야 할 핵심 개념 이름을 8~15개 선정합니다.
- 개념명은 간결한 명사구로 (예: "클로저", "호이스팅", "this 바인딩")
- 너무 지엽적이거나 중복되는 개념은 제외
- 설명·번호·마크다운 없이 개념명 문자열만
반드시 다음 JSON 형식만 출력하세요. 다른 텍스트 금지:
{"concepts": ["개념1", "개념2", ...]}`;

  const user = `대주제: ${subject.topic}
소주제: ${subject.sub}
세부주제: ${subject.detail}`;

  const text = await complete(apiKey, system, user, MAX_TOKENS_CONCEPTS);
  const parsed = parseJson<{ concepts: unknown }>(text);
  if (!Array.isArray(parsed.concepts)) return [];
  return parsed.concepts
    .map((c) => String(c).trim())
    .filter((c) => c.length > 0);
}

/** 개념 목록 → 오늘의 문제 생성 (기획서 3.6.5 generateQuestions) */
export async function runGenerateQuestions(
  apiKey: string,
  subject: SubjectInput,
  targets: ConceptTarget[],
  recentQuestions: string[],
): Promise<GeneratedQuestion[]> {
  const system = `당신은 코딩테스트·기술면접 학습용 문제 출제자입니다.
주어진 각 개념(conceptId)마다 문제를 정확히 1개씩 생성합니다.
- 개념 특성에 맞게 객관식("mcq") 또는 서술형("short")을 선택
- 객관식이면 choices 배열(4개)과 정답(answer)을 choices 중 하나로
- 서술형이면 choices 없이 모범답안을 answer에
- question/answer/explanation은 한국어
- recentQuestions에 있는 문제와 중복되지 않게
- 오답이 많은 개념(wrongCount 큰 개념)은 더 꼼꼼히 짚는 문제로
반드시 다음 JSON 형식만 출력하세요. 다른 텍스트 금지:
{"questions": [{"conceptId": "...", "type": "mcq"|"short", "question": "...", "choices": ["..."], "answer": "...", "explanation": "..."}]}`;

  const user = JSON.stringify({ subject, targets, recentQuestions });

  const text = await complete(apiKey, system, user, MAX_TOKENS_QUESTIONS);
  const parsed = parseJson<{ questions: unknown }>(text);
  if (!Array.isArray(parsed.questions)) return [];
  return parsed.questions as GeneratedQuestion[];
}
