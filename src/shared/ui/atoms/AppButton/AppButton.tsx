import { type ReactNode, type CSSProperties, type ButtonHTMLAttributes } from "react";
import { Button } from "@choi/ds";
import { cn } from "@/shared/lib/cn";

export type AppButtonVariant = "solid" | "outline" | "ghost";
export type AppButtonColor = "primary" | "gray" | "red" | "blue";
export type AppButtonSize = "lg" | "md" | "sm" | "xs";

interface AppButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: AppButtonVariant;
  color?: AppButtonColor;
  /** lg 48 · md 40 · sm 32px. xs는 sm과 같다 (DS에 xs 없음) */
  size?: AppButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  width?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

type DsVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * AppButton의 variant × color를 DS 모양 4종으로 줄인다.
 * - 채움(solid): 파랑 → primary, 빨강 → danger, 회색 → secondary
 * - 테두리(outline) → secondary, 투명(ghost) → ghost. 파란 글자는 DS처럼 중립색이 된다
 */
function toDsVariant(variant: AppButtonVariant, color: AppButtonColor): DsVariant {
  if (variant === "outline") return "secondary";
  if (variant === "ghost") return "ghost";
  if (color === "red") return "danger";
  if (color === "gray") return "secondary";
  return "primary";
}

/**
 * 버튼 — DS `Button` 어댑터.
 * 테두리·투명 버튼의 빨강은 삭제처럼 위험한 동작 표시라 유지한다 (index.css `.app-btn--danger`).
 */
export default function AppButton({
  variant = "solid",
  color = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  width,
  type = "button",
  className,
  style,
  ...props
}: AppButtonProps) {
  const keepsRedText = variant !== "solid" && color === "red";
  const mergedStyle: CSSProperties | undefined = width ? { ...style, width } : style;

  return (
    <Button
      {...props}
      type={type}
      variant={toDsVariant(variant, color)}
      size={size === "xs" ? "sm" : size}
      loading={loading}
      fullWidth={fullWidth}
      style={mergedStyle}
      className={cn(keepsRedText && "app-btn--danger", className)}
    />
  );
}
