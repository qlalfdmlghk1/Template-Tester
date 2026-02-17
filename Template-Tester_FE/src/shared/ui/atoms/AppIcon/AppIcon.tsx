import { type CSSProperties } from "react";
import { Icon } from "@iconify/react";

export type IconType = "heroicons" | "material";
export type IconVariant = "solid" | "outline";
export type IconSize = "sm" | "md" | "lg" | number;
export type MaterialWeight = "light" | "regular";

interface AppIconProps {
  /** 아이콘 이름 (예: 'check', 'home', 'arrow-left') */
  name: string;
  /** 아이콘 타입: heroicons(기본), material */
  type?: IconType;
  /** Heroicons 스타일 (solid/outline) */
  variant?: IconVariant;
  /** 아이콘 크기 */
  size?: IconSize;
  /** 아이콘 색상 */
  color?: string;
  /** Material 아이콘 굵기 (미지정 시 사이즈 기반 자동 선택) */
  materialWeight?: MaterialWeight;
  /** 추가 CSS 클래스 */
  className?: string;
}

const sizeMap: Record<string, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * 아이콘 이름을 kebab-case로 변환
 * 예: 'ArrowLeft' -> 'arrow-left', 'checkCircle' -> 'check-circle'
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * 기존 API를 @iconify 형식으로 변환
 * - heroicons: 'check' → 'heroicons:check' (outline) 또는 'heroicons-solid:check' (solid)
 * - material: 사이즈에 따라 다른 세트 사용
 *   - 20px 이하: 'material-symbols-light:drag-indicator'
 *   - 21px 이상: 'material-symbols:drag-indicator'
 *   - materialWeight 지정 시: 사이즈 무관하게 해당 굵기 사용
 */
function getIconifyName(
  name: string,
  type: IconType,
  variant: IconVariant,
  size: number,
  materialWeight?: MaterialWeight
): string {
  const kebabName = toKebabCase(name);

  if (type === "material") {
    let prefix: string;
    if (materialWeight) {
      prefix =
        materialWeight === "light"
          ? "material-symbols-light"
          : "material-symbols";
    } else {
      prefix = size <= 20 ? "material-symbols-light" : "material-symbols";
    }
    return `${prefix}:${kebabName}`;
  }

  return variant === "outline"
    ? `heroicons:${kebabName}`
    : `heroicons-solid:${kebabName}`;
}

export default function AppIcon({
  name,
  type = "heroicons",
  variant = "outline",
  size = "md",
  color = "currentColor",
  materialWeight,
  className = "",
}: AppIconProps) {
  const computedSize = typeof size === "number" ? size : (sizeMap[size] || 20);
  const iconifyName = getIconifyName(
    name,
    type,
    variant,
    computedSize,
    materialWeight
  );

  const style: CSSProperties = {
    width: `${computedSize}px`,
    height: `${computedSize}px`,
    ...(color !== "currentColor" ? { color } : {}),
  };

  const classes = [
    "inline-flex items-center justify-center shrink-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Icon
      icon={iconifyName}
      className={classes}
      style={style}
      aria-hidden="true"
    />
  );
}
