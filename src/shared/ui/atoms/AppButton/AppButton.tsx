import { type ReactNode, type CSSProperties, type ButtonHTMLAttributes } from "react";

export type AppButtonVariant = "solid" | "outline" | "ghost";
export type AppButtonColor = "primary" | "gray" | "red" | "blue";
export type AppButtonSize = "lg" | "md" | "sm" | "xs";

interface AppButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: AppButtonVariant;
  color?: AppButtonColor;
  size?: AppButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  width?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

const variantColorClasses: Record<
  AppButtonVariant,
  Record<AppButtonColor, string>
> = {
  solid: {
    primary:
      "bg-blue-500 border-blue-500 text-white enabled:hover:bg-blue-600 enabled:hover:border-blue-600 enabled:active:bg-blue-700 enabled:active:border-blue-700",
    gray: "bg-gray-600 border-gray-600 text-white enabled:hover:bg-gray-700 enabled:hover:border-gray-700 enabled:active:bg-gray-800 enabled:active:border-gray-800",
    red: "bg-red-500 border-red-500 text-white enabled:hover:bg-red-600 enabled:hover:border-red-600 enabled:active:bg-red-700 enabled:active:border-red-700",
    blue: "bg-blue-500 border-blue-500 text-white enabled:hover:bg-blue-600 enabled:hover:border-blue-600 enabled:active:bg-blue-700 enabled:active:border-blue-700",
  },
  outline: {
    primary:
      "bg-white text-blue-500 border-blue-300 enabled:hover:text-blue-600 enabled:hover:bg-blue-100 enabled:hover:border-blue-400 enabled:active:text-blue-700 enabled:active:bg-blue-200 enabled:active:border-blue-500",
    gray: "bg-white text-gray-600 border-gray-400 enabled:hover:text-gray-600 enabled:hover:bg-gray-100 enabled:hover:border-gray-400 enabled:active:text-gray-700 enabled:active:bg-gray-200 enabled:active:border-gray-400",
    red: "bg-white text-red-500 border-red-300 enabled:hover:text-red-600 enabled:hover:bg-red-100 enabled:hover:border-red-400 enabled:active:text-red-700 enabled:active:bg-red-200 enabled:active:border-red-500",
    blue: "bg-white text-blue-500 border-blue-300 enabled:hover:text-blue-600 enabled:hover:bg-blue-100 enabled:hover:border-blue-400 enabled:active:text-blue-700 enabled:active:bg-blue-200 enabled:active:border-blue-500",
  },
  ghost: {
    primary:
      "bg-transparent border-transparent text-blue-500 enabled:hover:text-blue-600 enabled:hover:bg-blue-100 enabled:active:text-blue-700 enabled:active:bg-blue-200",
    gray: "bg-transparent border-transparent text-gray-600 enabled:hover:text-gray-700 enabled:hover:bg-gray-200 enabled:active:text-gray-800 enabled:active:bg-gray-300",
    red: "bg-transparent border-transparent text-red-500 enabled:hover:text-red-600 enabled:hover:bg-red-100 enabled:active:text-red-700 enabled:active:bg-red-200",
    blue: "bg-transparent border-transparent text-blue-500 enabled:hover:text-blue-600 enabled:hover:bg-blue-100 enabled:active:text-blue-700 enabled:active:bg-blue-200",
  },
};

const sizeClasses: Record<AppButtonSize, string> = {
  lg: "h-[50px] px-6 rounded-md text-xl gap-3",
  md: "h-11 px-4 rounded-md text-base gap-2",
  sm: "h-9 px-2.5 rounded-md text-sm gap-2",
  xs: "h-8 px-2 rounded-md text-xs gap-1.5",
};

const iconSizeClasses: Record<AppButtonSize, string> = {
  lg: "w-6 h-6",
  md: "w-5 h-5",
  sm: "w-4 h-4",
  xs: "w-3 h-3",
};

export default function AppButton({
  variant = "solid",
  color = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  width,
  type = "button",
  disabled,
  iconLeft,
  iconRight,
  children,
  className = "",
  ...props
}: AppButtonProps) {
  const style: CSSProperties | undefined = width ? { width } : undefined;

  const classes = [
    "inline-flex items-center justify-center relative border cursor-pointer font-normal leading-none whitespace-nowrap",
    "transition-[background-color,border-color,color] duration-150 ease-in-out",
    "focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantColorClasses[variant][color],
    sizeClasses[size],
    loading && "!cursor-wait pointer-events-none",
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={disabled || loading}
      style={style}
      className={classes}
      {...props}
    >
      {loading && (
        <span className="absolute w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      <span
        className={[
          "inline-flex items-center justify-center [gap:inherit]",
          loading && "invisible",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {iconLeft && (
          <span
            className={`inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full ${iconSizeClasses[size]}`}
          >
            {iconLeft}
          </span>
        )}
        <span className="inline-flex items-center">{children}</span>
        {iconRight && (
          <span
            className={`inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full ${iconSizeClasses[size]}`}
          >
            {iconRight}
          </span>
        )}
      </span>
    </button>
  );
}
