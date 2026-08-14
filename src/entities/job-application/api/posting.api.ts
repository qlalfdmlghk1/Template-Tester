/**
 * 공고 추출 AI 호출 진입점.
 *
 * 사용자가 고른 제공자로 분기한다. 서버(프록시)를 두지 않고 사용자 본인 키로
 * 브라우저에서 직접 호출한다 — 배경과 보안 전제는 `shared/lib/useAiKey.ts` 참조.
 *
 * 제공자 SDK 는 어느 쪽도 추가하지 않는다. 키가 브라우저에 있는 구조에서 남는
 * 위험이 공급망(의존성 오염)이므로 런타임 의존성을 늘리지 않는다.
 */

import { extractWithAnthropic } from "./posting.anthropic";
import { extractWithGemini } from "./posting.gemini";
import type {
  PostingExtractInput,
  PostingExtractResult,
} from "./posting.shared";

export {
  AI_PROVIDERS,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  PostingExtractError,
  SUPPORTED_IMAGE_TYPES,
  isAbortError,
} from "./posting.shared";
export type {
  AiProvider,
  PostingExtractErrorKind,
  PostingExtractInput,
  PostingExtractResult,
  PostingExtractTarget,
  PostingImage,
} from "./posting.shared";

export async function extractPosting({
  provider,
  apiKey,
  signal,
  ...target
}: PostingExtractInput): Promise<PostingExtractResult> {
  return provider === "gemini"
    ? extractWithGemini(apiKey, target, signal)
    : extractWithAnthropic(apiKey, target, signal);
}
