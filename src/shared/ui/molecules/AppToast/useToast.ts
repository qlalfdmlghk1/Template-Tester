import { useContext } from "react";
import { ToastContext } from "./ToastContext";
import type { ToastContextValue } from "./ToastContext";

/** 토스트 알림 표시. ToastProvider 안에서만 쓸 수 있다. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast 는 ToastProvider 안에서만 사용할 수 있습니다.");
  }

  return context;
}
