import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { useAiKey, looksLikeApiKey } from "@/shared/lib/useAiKey";
import { AI_PROVIDERS } from "@/entities/company/api/research.api";
import type { AiProvider } from "@/entities/company/api/research.api";

interface AiKeyDialogProps {
  onClose: () => void;
}

interface ProviderInfo {
  label: string;
  /** 선택 버튼에 붙는 한 줄 요약 */
  summary: string;
  keyUrl: string;
  keyUrlLabel: string;
  placeholder: string;
}

const PROVIDER_INFO: Record<AiProvider, ProviderInfo> = {
  gemini: {
    label: "Gemini",
    summary: "무료 사용량 있음",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlLabel: "Google AI Studio",
    placeholder: "AIza...",
  },
  anthropic: {
    label: "Claude",
    summary: "크레딧 충전 필요",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "Anthropic 콘솔",
    placeholder: "sk-ant-...",
  },
};

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm";

/**
 * AI 조사에 쓸 제공자와 키를 설정한다.
 *
 * 이 서비스는 AI 호출용 서버를 두지 않으므로 각자 키가 필요하다.
 * 키는 브라우저에만 저장되며 서버로 전송되지 않는다 — 이 점을 화면에서도 분명히 알린다.
 */
export function AiKeyDialog({ onClose }: AiKeyDialogProps) {
  const {
    provider,
    setProvider,
    hasApiKey,
    maskedApiKey,
    hasKeyFor,
    saveApiKey,
    clearApiKey,
  } = useAiKey();
  const [draft, setDraft] = useState("");

  const info = PROVIDER_INFO[provider];
  const trimmed = draft.trim();
  const formatWarning = trimmed.length > 0 && !looksLikeApiKey(trimmed, provider);

  const handleSelectProvider = (next: AiProvider) => {
    setProvider(next);
    // 제공자마다 키 형식이 달라, 입력 중이던 값은 넘기지 않는다
    setDraft("");
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;

    saveApiKey(trimmed);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <form
        onSubmit={handleSave}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-key-title"
        className="relative flex flex-col gap-3 w-full max-w-[460px] md:max-w-[560px] max-h-[90vh] overflow-y-auto p-5 md:p-6 bg-surface border border-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <h2 id="ai-key-title" className="m-0 text-base font-semibold text-text">
          AI 조사 설정
        </h2>

        <p className="m-0 text-sm text-textSecondary">
          AI 자동 조사는 본인의 API 키로 동작합니다. 키는{" "}
          <strong className="font-semibold text-text">이 브라우저에만 저장</strong>되며 서버로
          전송되지 않습니다. 사용료도 본인 계정에 청구됩니다.
        </p>

        <fieldset className="m-0 p-0 border-0">
          <legend className="mb-1 text-sm font-medium text-text">사용할 AI</legend>
          <div className="grid grid-cols-2 gap-2">
            {AI_PROVIDERS.map((candidate) => {
              const selected = candidate === provider;
              const candidateInfo = PROVIDER_INFO[candidate];

              return (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => handleSelectProvider(candidate)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-start gap-0.5 px-3 py-2 text-left border rounded-sm transition-colors",
                    selected
                      ? "border-blue-500 ring-1 ring-blue-500 bg-blue-100"
                      : "bg-surface border-border hover:border-gray-400",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-text">
                    {candidateInfo.label}
                    {hasKeyFor(candidate) && (
                      <span className="px-1 py-0.5 rounded-sm text-xs bg-green-100 text-green-800">
                        키 있음
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-textSecondary">{candidateInfo.summary}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {provider === "anthropic" && (
          <p className="m-0 p-3 text-sm text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-sm">
            <strong className="font-semibold">
              Claude는 크레딧이 충전된 계정에서만 사용할 수 있습니다.
            </strong>{" "}
            키를 발급해도 Plans &amp; Billing에서 충전하지 않으면 조사가 실패합니다. Claude
            구독(Pro·Max)은 API와 별개 결제라 잔액이 채워지지 않습니다.
          </p>
        )}

        {provider === "gemini" && (
          <p className="m-0 p-3 text-sm text-textSecondary bg-background border border-border rounded-sm">
            무료 사용량으로 쓸 수 있습니다. 하루 호출 한도가 있어, 넘기면 다음 날 다시
            시도해야 합니다.
          </p>
        )}

        {hasApiKey ? (
          <div className="flex items-center justify-between gap-3 p-3 bg-green-100 border border-green-300 rounded-sm">
            <div className="min-w-0">
              <p className="m-0 text-sm font-medium text-text">
                {info.label} 키가 저장되어 있습니다
              </p>
              <p className="m-0 mt-0.5 text-xs text-textSecondary font-mono truncate">
                {maskedApiKey}
              </p>
            </div>
            <AppButton
              type="button"
              variant="outline"
              color="red"
              size="xs"
              onClick={() => clearApiKey()}
            >
              삭제
            </AppButton>
          </div>
        ) : (
          <p className="m-0 p-3 text-sm text-textSecondary bg-background border border-border rounded-sm">
            {info.label} 키가 없습니다. AI 조사를 쓰려면 키를 입력해 주세요.
          </p>
        )}

        <div>
          <label htmlFor="ai-key-input" className="block mb-1 text-sm font-medium text-text">
            {hasApiKey ? `${info.label} 키 변경` : `${info.label} API 키`}
          </label>
          <input
            id="ai-key-input"
            type="password"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={info.placeholder}
            autoComplete="off"
            spellCheck={false}
            className={cn(inputClass, "font-mono")}
          />
          {formatWarning && (
            <p className="m-0 mt-1 text-xs text-red-600">
              Claude 키는 보통 <code>sk-ant-</code> 로 시작합니다. 그래도 저장할 수 있습니다.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 p-3 text-xs text-textSecondary bg-background border border-border rounded-sm">
          <p className="m-0">
            키 발급:{" "}
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {info.keyUrlLabel}
            </a>
          </p>
          <p className="m-0">
            콘솔에서 <strong className="font-semibold">지출 한도</strong>를 걸어두면 예상 밖의
            요금을 막을 수 있습니다.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <AppButton type="button" variant="outline" color="gray" size="sm" onClick={onClose}>
            닫기
          </AppButton>
          <AppButton type="submit" size="sm" disabled={!trimmed}>
            저장
          </AppButton>
        </div>
      </form>
    </div>
  );
}
