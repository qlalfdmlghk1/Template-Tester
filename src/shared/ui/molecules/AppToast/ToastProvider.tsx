import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppToast from "./AppToast";
import { ToastContext } from "./ToastContext";
import type { ToastItem, ToastType } from "./ToastContext";

const AUTO_DISMISS_MS = 3000;

/** 토스트 목록을 들고 화면 우하단에 쌓아 보여준다 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);
  // 배열에 쌓기만 하면 발화된 타이머가 세션 내내 남으므로 id 로 관리해 지운다
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;

      setToasts((current) => [...current, { id, type, message }]);
      timersRef.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS));
    },
    [dismiss],
  );

  // 언마운트 시 남은 타이머 정리
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 max-w-[calc(100vw-2rem)] w-[320px]"
      >
        {toasts.map((toast) => (
          <AppToast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
