import { AppConfirmModal } from "@choi/ds";

export interface AppConfirmDialogProps {
  open: boolean;
  title: string;
  /** 줄바꿈(\n)은 그대로 표시한다 */
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

/**
 * 되돌리기 어려운 동작 전에 한 번 묻는 모달 — DS `AppConfirmModal` 어댑터.
 * 포커스(danger면 취소 버튼), Esc 닫기, 처리 중 닫기 차단은 DS가 맡는다.
 * DS 정책상 바깥(어두운 막) 클릭으로는 닫히지 않는다.
 */
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
  return (
    <AppConfirmModal
      open={open}
      title={title}
      description={
        description && <span className="whitespace-pre-wrap">{description}</span>
      }
      confirmLabel={confirmText}
      cancelLabel={cancelText}
      tone={danger ? "danger" : "default"}
      loading={loading}
      onConfirm={onConfirm}
      onClose={onCancel}
    >
      {children}
    </AppConfirmModal>
  );
}
