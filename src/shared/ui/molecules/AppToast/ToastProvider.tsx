import { useMemo } from "react";
// DS useToast({ toast }) — 같은 폴더의 앱 useToast({ showToast }, ./useToast)와 다른 훅이다. 이 파일에서만 DS 것을 쓴다
import { AppToastProvider, useToast } from "@choi/ds";
import { TOAST_TONE, ToastContext } from "./ToastContext";
import type { ToastType } from "./ToastContext";

interface ToastProviderProps {
  children: React.ReactNode;
}

/** DS 토스트 API를 프로젝트의 showToast(message, type) 시그니처로 노출한다 */
function ToastBridge({ children }: ToastProviderProps) {
  const { toast } = useToast();

  const value = useMemo(
    () => ({
      showToast: (message: string, type: ToastType = "success") => {
        toast({ title: message, tone: TOAST_TONE[type] });
      },
    }),
    [toast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/** 앱 최상단에 한 번 감싼다. 토스트는 화면 우하단에 쌓인다 (@choi/ds ToastProvider 기반) */
export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <AppToastProvider position="bottom-right">
      <ToastBridge>{children}</ToastBridge>
    </AppToastProvider>
  );
}
