import { AppToast as DsToast } from "@choi/ds";
import { TOAST_TONE } from "./ToastContext";
import type { ToastType } from "./ToastContext";

export interface AppToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

/** 단일 토스트 표시 — 목록 관리는 ToastProvider가 한다 (@choi/ds Toast 기반) */
export default function AppToast({ type, message, onClose }: AppToastProps) {
  return <DsToast title={message} tone={TOAST_TONE[type]} onClose={onClose} />;
}
