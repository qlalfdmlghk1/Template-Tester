export type ChipVariant = "primary" | "secondary" | "success" | "warning" | "error" | "purple";

interface ChipProps {
  variant?: ChipVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ChipVariant, string> = {
  primary: "bg-blue-100 text-primary",
  secondary: "bg-gray-100 text-textSecondary",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  purple: "bg-purple-100 text-purple-700",
};

export default function Chip({ variant = "primary", children, className = "" }: ChipProps) {
  const classes = ["px-2 py-0.5 text-xs rounded", variantClasses[variant], className].filter(Boolean).join(" ");

  return <span className={classes}>{children}</span>;
}
