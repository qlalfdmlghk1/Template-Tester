import { AppTextarea } from "@choi/ds";
import { cn } from "@/shared/lib/cn";
import type { TextareaHTMLAttributes } from "react";

export interface AppTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 입력창 위 라벨. 화면에 따로 라벨이 있으면 비우고 id로 연결한다 */
  label?: string;
  /** 입력창 아래 도움말. error가 있으면 error가 대신 보인다 */
  helperText?: string;
  /** 에러 문구. 넣으면 빨간 테두리 + 문구 + aria-invalid */
  error?: string;
  /** 보이는 줄 수. 기본 4 */
  rows?: number;
  /** 내용에 맞춰 높이를 늘린다 (maxRows까지) */
  autoResize?: boolean;
  maxRows?: number;
  /** maxLength와 함께 쓰면 글자 수 표시 */
  showCount?: boolean;
  /** 크기 조절 손잡이. 기본 vertical(세로만) */
  resize?: "vertical" | "none";
  /** 바깥 래퍼에 붙는다. 기본 w-full이고 너비·배치 클래스로 덮어쓴다 */
  className?: string;
}

/**
 * 여러 줄 입력창 — DS `AppTextarea` 어댑터.
 * rows·placeholder·maxLength·disabled 등 textarea의 기본 속성은 그대로 전달된다.
 * DS가 ref를 받지 않으므로 포커스를 옮길 때는 id로 찾는다.
 * 너비는 AppTextInput과 같이 래퍼 div가 받고 DS 필드는 항상 래퍼를 채운다.
 */
function AppTextareaAdapter({ className, ...props }: AppTextareaProps) {
  return (
    <div className={cn("w-full", className)}>
      <AppTextarea fullWidth {...props} />
    </div>
  );
}

AppTextareaAdapter.displayName = "AppTextarea";

export default AppTextareaAdapter;
