import { useEffect, useRef } from "react";
import AppButton from "../../atoms/AppButton/AppButton";

export interface AppConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** 삭제처럼 되돌리기 어려운 동작이면 확인 버튼을 경고색으로 */
  danger?: boolean;
  loading?: boolean;
  /** 설명 아래에 넣을 부가 입력 (예: "딸린 항목도 함께 삭제" 체크박스) */
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 되돌리기 어려운 동작 전에 한 번 묻는 모달 */
export default function AppConfirmDialog({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  danger = false,
  loading = false,
  children,
  onConfirm,
  onCancel,
}: AppConfirmDialogProps) {
  // AppButton은 ref를 노출하지 않으므로 감싼 요소에서 버튼을 찾아 포커스한다
  const actionsRef = useRef<HTMLDivElement>(null);

  // 열릴 때 확인 버튼으로 포커스를 옮기고, ESC로 닫는다
  useEffect(() => {
    if (!open) return;

    actionsRef.current
      ?.querySelector<HTMLButtonElement>("button:last-of-type")
      ?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-[400px] p-5 bg-surface border border-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <h2 id="confirm-dialog-title" className="m-0 mb-2 text-base font-semibold text-text">
          {title}
        </h2>
        {description && (
          <p className="m-0 mb-3 text-sm text-textSecondary whitespace-pre-wrap">
            {description}
          </p>
        )}

        {children && <div className="mb-4">{children}</div>}

        <div ref={actionsRef} className="flex justify-end gap-2">
          <AppButton variant="outline" color="gray" size="sm" onClick={onCancel}>
            {cancelText}
          </AppButton>
          <AppButton
            color={danger ? "red" : "primary"}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
