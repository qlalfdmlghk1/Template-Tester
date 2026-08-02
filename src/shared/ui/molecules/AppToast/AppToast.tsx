import AppIcon from "../../atoms/AppIcon/AppIcon";
import { cn } from "@/shared/lib/cn";
import type { ToastType } from "./ToastContext";

export interface AppToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

const TYPE_STYLES: Record<ToastType, { icon: string; className: string }> = {
  success: {
    icon: "check-circle",
    className: "bg-green-50 border-green-300 text-green-800",
  },
  error: {
    icon: "exclamation-triangle",
    className: "bg-red-50 border-red-300 text-red-800",
  },
};

/** 단일 토스트 표시 — 목록 관리는 ToastProvider가 한다 */
export default function AppToast({ type, message, onClose }: AppToastProps) {
  const style = TYPE_STYLES[type];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 border rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.12)]",
        style.className,
      )}
    >
      <AppIcon name={style.icon} size={18} className="shrink-0" />
      <p className="m-0 flex-1 text-sm">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="알림 닫기"
          className="shrink-0 p-0.5 rounded-sm hover:bg-black/5"
        >
          <AppIcon name="x-mark" size={14} />
        </button>
      )}
    </div>
  );
}
