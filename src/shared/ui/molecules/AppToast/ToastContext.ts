import { createContext } from "react";
import type { ToastTone } from "@choi/ds";

export type ToastType = "success" | "error";

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

/** 프로젝트 ToastType → DS ToastTone */
export const TOAST_TONE: Record<ToastType, ToastTone> = {
  success: "success",
  error: "danger",
};

export const ToastContext = createContext<ToastContextValue | null>(null);
