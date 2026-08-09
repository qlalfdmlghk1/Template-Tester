/**
 * 기업 조사 AI 호출 진입점.
 *
 * 사용자가 고른 제공자로 분기한다. 서버(프록시)를 두지 않고 사용자 본인 키로
 * 브라우저에서 직접 호출한다 — 배경과 보안 전제는 `shared/lib/useAiKey.ts` 참조.
 *
 * 제공자 SDK 는 어느 쪽도 추가하지 않는다. 키가 브라우저에 있는 구조에서 남는
 * 위험이 공급망(의존성 오염)이므로 런타임 의존성을 늘리지 않는다.
 */

import { researchWithAnthropic } from "./research.anthropic";
import { researchWithGemini } from "./research.gemini";
import type {
  CompanyResearchInput,
  CompanyResearchResult,
} from "./research.shared";

export {
  AI_PROVIDERS,
  CompanyResearchError,
  isAbortError,
} from "./research.shared";
export type {
  AiProvider,
  CompanyResearchErrorKind,
  CompanyResearchInput,
  CompanyResearchResult,
  CompanyResearchTarget,
} from "./research.shared";

export async function researchCompany({
  provider,
  apiKey,
  signal,
  ...target
}: CompanyResearchInput): Promise<CompanyResearchResult> {
  return provider === "gemini"
    ? researchWithGemini(apiKey, target, signal)
    : researchWithAnthropic(apiKey, target, signal);
}
