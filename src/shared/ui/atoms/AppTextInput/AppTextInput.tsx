import { TextInput } from "@choi/ds";
import { cn } from "@/shared/lib/cn";
import type { InputHTMLAttributes, ReactNode } from "react";

export type AppTextInputSize = "sm" | "md" | "lg";

export interface AppTextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  /** 높이. sm 32 · md 40 · lg 48px — AppSelect와 같은 기준 */
  size?: AppTextInputSize;
  /** 입력창 위 라벨. 화면에 따로 라벨이 있으면 비우고 id로 연결한다 */
  label?: string;
  /** 입력창 아래 도움말. error가 있으면 error가 대신 보인다 */
  helperText?: string;
  /** 에러 문구. 넣으면 빨간 테두리 + 문구 + aria-invalid */
  error?: string;
  /** 값 앞 아이콘 (검색 돋보기 등) */
  iconLeft?: ReactNode;
  /** 값 뒤 단위·텍스트 ("원", "%") */
  suffix?: ReactNode;
  /** maxLength와 함께 쓰면 글자 수 표시 */
  showCount?: boolean;
  /** 바깥 래퍼에 붙는다. 기본 w-full이고 w-48·sm:w-40 같은 너비·배치 클래스로 덮어쓴다 */
  className?: string;
}

/**
 * 한 줄 입력창 — DS `TextInput` 어댑터.
 * text·password·url·number·search 등 input의 기본 속성은 그대로 전달된다.
 *
 * DS 필드는 자체 너비(280px / 100%)를 갖고 DS CSS가 Tailwind보다 뒤에 로드돼 너비 클래스가 지므로,
 * 래퍼 div가 너비를 받고 DS 필드는 항상 래퍼를 채운다.
 */
export default function AppTextInput({ size = "md", className, ...props }: AppTextInputProps) {
  return (
    <div className={cn("w-full", className)}>
      <TextInput size={size} fullWidth {...props} />
    </div>
  );
}
