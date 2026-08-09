/**
 * AI 제공자 목록.
 *
 * 키 보관(`shared/lib/useAiKey`)과 호출 계층(`entities/company/api/research.*`)이
 * 함께 쓰므로 shared 에 둔다 — 키 저장소가 특정 도메인 슬라이스를 향해 거꾸로
 * 의존하면 FSD 방향 규칙이 깨진다.
 */

/** 사용자가 고를 수 있는 AI 제공자 */
export const AI_PROVIDERS = ["gemini", "anthropic"] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number];
