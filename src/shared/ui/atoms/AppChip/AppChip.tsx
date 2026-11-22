import { AppBadge } from "@choi/ds";
import type { AppBadgeProps } from "@choi/ds";
import { cn } from "@/shared/lib/cn";

export type ChipVariant = "primary" | "secondary" | "success" | "warning" | "error" | "purple";

interface ChipProps {
  variant?: ChipVariant;
  children: React.ReactNode;
  className?: string;
}

/** DS AppBadge 의미 색(4가지)에 대응. warning·purple은 DS에 없어 앱 색 클래스를 덧입힌다 (index.css `.app-chip--*`). */
const toneMap: Record<ChipVariant, NonNullable<AppBadgeProps["tone"]>> = {
  primary: "brand",
  secondary: "neutral",
  success: "success",
  warning: "neutral",
  error: "danger",
  purple: "neutral",
};

const appColorClass: Partial<Record<ChipVariant, string>> = {
  warning: "app-chip--warning",
  purple: "app-chip--purple",
};

export default function AppChip({ variant = "primary", children, className }: ChipProps) {
  return (
    <AppBadge tone={toneMap[variant]} variant="soft" size="sm" className={cn(appColorClass[variant], className) || undefined}>
      {children}
    </AppBadge>
  );
}
