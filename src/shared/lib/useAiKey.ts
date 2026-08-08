/**
 * 사용자 본인의 AI API 키 보관.
 *
 * 이 서비스는 AI 호출용 서버를 두지 않는다(Firebase Functions 배포에 Blaze 전환이 필요해
 * 채택하지 않음). 대신 사용자가 자기 키를 입력해 브라우저에서 직접 호출한다.
 *
 * 제공자는 두 가지다 — Gemini(무료 사용량 있음)와 Anthropic(크레딧 충전 필요).
 * 키는 제공자별로 따로 보관해, 오가며 다시 입력하지 않아도 되게 한다.
 *
 * 보안 전제 — 지키지 않으면 이 방식이 성립하지 않는다:
 * - 키를 서버(Firestore 포함)로 보내지 않는다. 기기 간 동기화 목적이라도 금지.
 *   우리 DB가 타인의 API 키 보관소가 되는 순간 사고 범위가 완전히 달라진다.
 * - 키를 콘솔·에러 리포트에 출력하지 않는다.
 *
 * 기업 조사뿐 아니라 Daily 학습도 쓸 수 있도록 shared 에 둔다.
 */

import { useCallback, useEffect, useState } from "react";
import type { AiProvider } from "@/entities/company/api/research.shared";

const PROVIDER_STORAGE_KEY = "ai-provider";

/** 제공자별 키 저장소. anthropic 은 기존 사용자를 위해 기존 키 이름을 유지한다. */
const KEY_STORAGE: Record<AiProvider, string> = {
  gemini: "gemini-api-key",
  anthropic: "anthropic-api-key",
};

/** 같은 탭 안의 다른 훅 인스턴스에 변경을 알린다 (storage 이벤트는 다른 탭에만 발생) */
const CHANGE_EVENT = "ai-key-change";

function read(storageKey: string): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    // 시크릿 모드 등 localStorage 접근이 막힌 환경
    return null;
  }
}

function isProvider(value: string | null): value is AiProvider {
  return value === "gemini" || value === "anthropic";
}

/**
 * 처음 들어온 사용자는 충전이 필요 없는 Gemini 를 기본으로 둔다.
 * 단, 이미 Anthropic 키를 넣어둔 사용자는 그 선택을 유지한다.
 */
function readProvider(): AiProvider {
  const stored = read(PROVIDER_STORAGE_KEY);
  if (isProvider(stored)) return stored;

  return read(KEY_STORAGE.anthropic) ? "anthropic" : "gemini";
}

/** 화면에 표시할 형태로 가린다 — 원문을 그대로 노출하지 않는다 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return "•".repeat(key.length);
  return `${key.slice(0, 8)}${"•".repeat(8)}${key.slice(-4)}`;
}

/**
 * 형식만 훑는 검사. 유효성의 최종 판단은 실제 호출의 응답이 한다 —
 * 여기서 과하게 막으면 키 형식이 바뀌었을 때 멀쩡한 키를 거부하게 된다.
 * Gemini 키는 고정 접두사가 없어 검사하지 않는다.
 */
export function looksLikeApiKey(key: string, provider: AiProvider): boolean {
  if (provider === "anthropic") return key.trim().startsWith("sk-ant-");
  return key.trim().length > 0;
}

export function useAiKey() {
  const [provider, setProviderState] = useState<AiProvider>(readProvider);
  const [keys, setKeys] = useState<Record<AiProvider, string | null>>(() => ({
    gemini: read(KEY_STORAGE.gemini),
    anthropic: read(KEY_STORAGE.anthropic),
  }));

  useEffect(() => {
    const sync = () => {
      setProviderState(readProvider());
      setKeys({
        gemini: read(KEY_STORAGE.gemini),
        anthropic: read(KEY_STORAGE.anthropic),
      });
    };

    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const notifyChange = () => window.dispatchEvent(new Event(CHANGE_EVENT));

  const setProvider = useCallback((next: AiProvider) => {
    try {
      localStorage.setItem(PROVIDER_STORAGE_KEY, next);
    } catch {
      // 저장 실패해도 이번 세션 동안은 선택이 유지되게 상태만 반영한다
    }
    setProviderState(next);
    notifyChange();
  }, []);

  const saveApiKey = useCallback(
    (key: string, target?: AiProvider) => {
      const forProvider = target ?? provider;
      const trimmed = key.trim();

      try {
        localStorage.setItem(KEY_STORAGE[forProvider], trimmed);
      } catch {
        // 위와 같음
      }
      setKeys((current) => ({ ...current, [forProvider]: trimmed }));
      notifyChange();
    },
    [provider],
  );

  const clearApiKey = useCallback(
    (target?: AiProvider) => {
      const forProvider = target ?? provider;

      try {
        localStorage.removeItem(KEY_STORAGE[forProvider]);
      } catch {
        // 삭제 실패는 무시 — 상태는 비운다
      }
      setKeys((current) => ({ ...current, [forProvider]: null }));
      notifyChange();
    },
    [provider],
  );

  const apiKey = keys[provider];

  return {
    provider,
    setProvider,
    apiKey,
    hasApiKey: Boolean(apiKey),
    maskedApiKey: apiKey ? maskApiKey(apiKey) : null,
    /** 특정 제공자에 키가 있는지 — 선택 UI 에서 표시용 */
    hasKeyFor: (target: AiProvider) => Boolean(keys[target]),
    saveApiKey,
    clearApiKey,
  };
}
