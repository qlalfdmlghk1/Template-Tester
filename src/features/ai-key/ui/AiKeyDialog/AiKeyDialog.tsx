import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { useAiKey, looksLikeApiKey } from "@/shared/lib/useAiKey";

interface AiKeyDialogProps {
  onClose: () => void;
}

const KEY_CONSOLE_URL = "https://console.anthropic.com/settings/keys";

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm";

/**
 * 사용자 본인의 Anthropic API 키를 입력받는다.
 *
 * 이 서비스는 AI 호출용 서버를 두지 않으므로 각자 키가 필요하다.
 * 키는 브라우저에만 저장되며 서버로 전송되지 않는다 — 이 점을 화면에서도 분명히 알린다.
 */
export function AiKeyDialog({ onClose }: AiKeyDialogProps) {
  const { hasApiKey, maskedApiKey, saveApiKey, clearApiKey } = useAiKey();
  const [draft, setDraft] = useState("");

  const trimmed = draft.trim();
  const formatWarning = trimmed.length > 0 && !looksLikeApiKey(trimmed);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;

    saveApiKey(trimmed);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          AI 자동 조사는 본인의 Anthropic API 키로 동작합니다. 키는{" "}
          <strong className="font-semibold text-text">이 브라우저에만 저장</strong>되며 서버로
          전송되지 않습니다. 사용료도 본인 계정에 청구됩니다.
        </p>

        {hasApiKey ? (
          <div className="flex items-center justify-between gap-3 p-3 bg-green-100 border border-green-300 rounded-sm">
            <div className="min-w-0">
              <p className="m-0 text-sm font-medium text-text">키가 저장되어 있습니다</p>
              <p className="m-0 mt-0.5 text-xs text-textSecondary font-mono truncate">
                {maskedApiKey}
              </p>
            </div>
            <AppButton
              type="button"
              variant="outline"
              color="red"
              size="xs"
              onClick={clearApiKey}
            >
              삭제
            </AppButton>
          </div>
        ) : (
          <p className="m-0 p-3 text-sm text-textSecondary bg-background border border-border rounded-sm">
            아직 키가 없습니다. AI 조사를 쓰려면 키를 입력해 주세요.
          </p>
        )}

        <div>
          <label htmlFor="ai-key-input" className="block mb-1 text-sm font-medium text-text">
            {hasApiKey ? "키 변경" : "API 키"}
          </label>
          <input
            id="ai-key-input"
            type="password"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
            className={cn(inputClass, "font-mono")}
          />
          {formatWarning && (
            <p className="m-0 mt-1 text-xs text-red-600">
              Anthropic 키는 보통 <code>sk-ant-</code> 로 시작합니다. 그래도 저장할 수 있습니다.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 p-3 text-xs text-textSecondary bg-background border border-border rounded-sm">
          <p className="m-0">
            키 발급:{" "}
            <a
              href={KEY_CONSOLE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Anthropic 콘솔
            </a>
          </p>
          <p className="m-0">
            키를 만든 뒤 <strong className="font-semibold">Plans &amp; Billing에서 크레딧을 충전</strong>
            해야 동작합니다. 충전 전에는 조사가 실패합니다.
          </p>
          <p className="m-0">
            같은 화면에서 <strong className="font-semibold">지출 한도</strong>를 걸어두면 예상 밖의
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
