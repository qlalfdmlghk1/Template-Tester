/**
 * 사용자 본인의 Anthropic API 키 보관.
 *
 * 이 서비스는 AI 호출용 서버를 두지 않는다(Firebase Functions 배포에 Blaze 전환이 필요해
 * 채택하지 않음). 대신 사용자가 자기 키를 입력해 브라우저에서 직접 호출한다.
 *
 * 보안 전제 — 지키지 않으면 이 방식이 성립하지 않는다:
 * - 키를 서버(Firestore 포함)로 보내지 않는다. 기기 간 동기화 목적이라도 금지.
 *   우리 DB가 타인의 API 키 보관소가 되는 순간 사고 범위가 완전히 달라진다.
 * - 키를 콘솔·에러 리포트에 출력하지 않는다.
 *
 * 기업 조사뿐 아니라 Daily 학습도 쓸 수 있도록 shared 에 둔다.
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "anthropic-api-key";

/** 같은 탭 안의 다른 훅 인스턴스에 변경을 알리기 위한 이벤트 (storage 이벤트는 다른 탭에만 발생) */
const CHANGE_EVENT = "ai-key-change";

function readKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // 시크릿 모드 등 localStorage 접근이 막힌 환경
    return null;
  }
}

/** 화면에 표시할 형태로 가린다 — 원문을 그대로 노출하지 않는다 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return "•".repeat(key.length);
  return `${key.slice(0, 8)}${"•".repeat(8)}${key.slice(-4)}`;
}

/**
 * 형식만 훑는 검사. 유효성의 최종 판단은 실제 호출의 401 응답이 한다 —
 * 여기서 과하게 막으면 키 형식이 바뀌었을 때 멀쩡한 키를 거부하게 된다.
 */
export function looksLikeApiKey(key: string): boolean {
  return key.trim().startsWith("sk-ant-");
}

export function useAiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(readKey);

  useEffect(() => {
    const sync = () => setApiKeyState(readKey());

    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const saveApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // 저장에 실패해도 이번 세션 동안은 쓸 수 있게 상태만이라도 반영한다
    }
    setApiKeyState(trimmed);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const clearApiKey = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 삭제 실패는 무시 — 상태는 비운다
    }
    setApiKeyState(null);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    apiKey,
    hasApiKey: Boolean(apiKey),
    maskedApiKey: apiKey ? maskApiKey(apiKey) : null,
    saveApiKey,
    clearApiKey,
  };
}
