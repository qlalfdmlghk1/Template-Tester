import { useState, useRef, useEffect } from "react";

export type SelectBoxSize = "sm" | "md" | "lg";

export interface SelectBoxOption {
  value: string;
  label: string;
}

interface SelectBoxProps {
  options: SelectBoxOption[];
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  selectSize?: SelectBoxSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

const sizeClasses: Record<SelectBoxSize, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function SelectBox({
  options,
  placeholder = "선택하세요",
  selectSize = "md",
  fullWidth = false,
  className = "",
  disabled = false,
  value,
  onChange,
}: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // value prop을 직접 사용 (제어 컴포넌트)
  const currentValue = value || "";
  const selectedOption = options.find((opt) => opt.value === currentValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    setIsOpen(false);

    if (onChange) {
      const syntheticEvent = {
        target: { value: optionValue },
        currentTarget: { value: optionValue },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  const buttonClasses = [
    "box-border appearance-none select-custom-arrow",
    "outline outline-1 outline-border rounded-md bg-surface text-text cursor-pointer transition-all duration-200 ease-in-out",
    "hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200",
    "flex items-center justify-between",
    "w-full",
    sizeClasses[selectSize],
    disabled && "opacity-50 cursor-not-allowed",
    !currentValue && "text-textSecondary",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={dropdownRef} className={`relative ${fullWidth ? 'w-full' : 'w-64'}`}>
      <button
        type="button"
        className={buttonClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="truncate">{displayText}</span>
        <svg
          className="w-4 h-4 ml-2 shrink-0 transition-colors"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="box-border absolute z-50 w-full mt-1 bg-surface outline outline-1 outline-border rounded-lg shadow-lg max-h-60 overflow-auto scrollbar-hide">
          {placeholder && (
            <div
              className="px-4 py-2 text-sm text-textSecondary hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => handleSelect("")}
            >
              {placeholder}
            </div>
          )}
          {options.map((option) => (
            <div
              key={option.value}
              className={[
                "px-4 py-2 text-sm cursor-pointer transition-colors",
                currentValue === option.value ? "bg-blue-50 text-primary font-medium" : "text-text hover:bg-blue-50",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
