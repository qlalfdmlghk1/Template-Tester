interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleButtonGroupProps {
  options: ToggleOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

export default function ToggleButtonGroup({
  options,
  value,
  onChange,
  multiple = false,
}: ToggleButtonGroupProps) {
  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleClick = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(value === optionValue ? "" : optionValue);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleClick(option.value)}
          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
            isSelected(option.value)
              ? "bg-primary text-white border-primary"
              : "bg-surface text-textSecondary border-border hover:border-primary hover:text-primary"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
