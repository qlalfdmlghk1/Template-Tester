export type ButtonVariant = "primary" | "secondary" | "success" | "error" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-surface hover:bg-blue-600 hover:shadow-[0_2px_8px_rgba(191,219,254,1)]",
  secondary: "bg-transparent text-primary border border-primary hover:bg-blue-100 hover:text-blue-700 hover:border-blue-600",
  success: "bg-success text-surface hover:bg-green-600 hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(187,247,208,1)]",
  error: "bg-error text-surface hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(254,202,202,1)]",
  ghost: "bg-transparent text-textSecondary hover:bg-blue-50 hover:text-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1 text-xs",
  md: "px-6 py-2 text-sm",
  lg: "px-8 py-4 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center font-semibold rounded-md cursor-pointer transition-all duration-200 ease-in-out outline-none",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    disabled && "opacity-50 cursor-not-allowed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
