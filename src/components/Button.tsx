import { useState } from "react";
import { theme } from "../styles/theme";

export type ButtonVariant = "primary" | "secondary" | "success" | "error";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle: React.CSSProperties = {
    ...styles.base,
    ...styles.variant[variant],
    ...styles.size[size],
    ...(fullWidth && styles.fullWidth),
    ...(disabled && styles.disabled),
    ...(isHovered && !disabled && styles.hover[variant]),
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    onMouseLeave?.(e);
  };

  return (
    <button
      style={buttonStyle}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
}

const styles: {
  base: React.CSSProperties;
  variant: Record<ButtonVariant, React.CSSProperties>;
  size: Record<ButtonSize, React.CSSProperties>;
  fullWidth: React.CSSProperties;
  disabled: React.CSSProperties;
  hover: Record<ButtonVariant, React.CSSProperties>;
} = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    border: "none",
    borderRadius: theme.borderRadius.md,
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    outline: "none",
    fontFamily: "inherit",
  },
  variant: {
    primary: {
      color: theme.colors.surface,
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      color: theme.colors.primary,
      backgroundColor: "transparent",
      border: `1px solid ${theme.colors.primary}`,
    },
    success: {
      color: theme.colors.surface,
      backgroundColor: theme.colors.success,
    },
    error: {
      color: theme.colors.surface,
      backgroundColor: theme.colors.error,
    },
  },
  size: {
    sm: {
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      fontSize: "12px",
    },
    md: {
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      fontSize: "14px",
    },
    lg: {
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      fontSize: "16px",
    },
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  hover: {
    primary: {
      backgroundColor: theme.colors.primaryLight,
    },
    secondary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.surface,
    },
    success: {
      backgroundColor: "#059669", // 더 어두운 green
      transform: "translateY(-1px)",
      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
    },
    error: {
      backgroundColor: "#DC2626", // 더 어두운 red
      transform: "translateY(-1px)",
      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
    },
  },
};
