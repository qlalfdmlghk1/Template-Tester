import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/common.utils";

type ComponentSize = "sm" | "md" | "lg";
type ToggleTabBarType = "default" | "icon-only";

export interface Tab {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface ToggleTabBarProps {
  size: ComponentSize;
  type?: ToggleTabBarType;
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
}

export default function ToggleTabBar({
  size,
  type = "default",
  tabs,
  value,
  onChange,
}: ToggleTabBarProps) {
  const iconSize = useMemo(() => {
    switch (size) {
      case "sm":
        return 16;
      case "md":
        return 20;
      case "lg":
        return 24;
      default:
        return 20;
    }
  }, [size]);

  return (
    <div
      className={cn(
        "inline-flex items-center shrink-0 rounded-md border border-gray-300 bg-white",
        size === "sm" && "h-9",
        size === "md" && "h-11",
        size === "lg" && "h-[50px]",
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.value === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex flex-1 items-center justify-center h-full gap-2 whitespace-nowrap",
              "border-none bg-transparent cursor-pointer transition-colors",
              "text-gray-600 text-sm font-medium",
              size === "sm" && "px-3",
              size === "md" && "px-3.5",
              size === "lg" && "px-4 text-base gap-3",
              idx === 0 && "rounded-l-md",
              idx === tabs.length - 1 && "rounded-r-md",
              isActive && "bg-gray-700 text-white",
            )}
          >
            {(Icon || type === "icon-only") && Icon && (
              <Icon size={iconSize} className="shrink-0" />
            )}

            {type !== "icon-only" && <span>{tab.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
