import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import type {
  AppSelectProps,
  SelectOption,
  SelectSize,
  SelectValue,
} from "./AppSelect.type";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function ChevronDownIcon() {
  return (
    <svg
      className="w-[18px] h-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      className="w-[18px] h-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tailwind Class Maps
// ---------------------------------------------------------------------------

type ComputedState = "default" | "focused" | "disabled" | "error" | "error-focused";

const triggerSizeClasses: Record<SelectSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-[50px] px-4 text-base",
};

const triggerStateClasses: Record<ComputedState, string> = {
  default: "border-gray-400 bg-white",
  focused: "border-blue-500 bg-white",
  disabled: "bg-gray-100 border-gray-300 cursor-not-allowed",
  error: "border-red-500 bg-red-50",
  "error-focused": "border-red-500 bg-white",
};

const valueColorMap: Record<ComputedState, { value: string; placeholder: string }> = {
  default: { value: "text-gray-700", placeholder: "text-gray-500" },
  focused: { value: "text-gray-700", placeholder: "text-gray-500" },
  disabled: { value: "text-gray-400", placeholder: "text-gray-400" },
  error: { value: "text-red-500", placeholder: "text-red-400" },
  "error-focused": { value: "text-gray-700", placeholder: "text-gray-500" },
};

const arrowColorMap: Record<ComputedState, string> = {
  default: "text-gray-500",
  focused: "text-gray-500",
  disabled: "text-gray-400",
  error: "text-red-500",
  "error-focused": "text-gray-500",
};

// ---------------------------------------------------------------------------
// Internal: SelectOptionItem
// ---------------------------------------------------------------------------

interface SelectOptionItemProps {
  option?: SelectOption;
  index?: number;
  isSelectAll?: boolean;
  multiple: boolean;
  highlightedIndex: number;
  isSelected: (value: SelectValue) => boolean;
  isAllSelected: boolean;
  onSelect: (option: SelectOption) => void;
  onToggleSelectAll: () => void;
}

function SelectOptionItem({
  option,
  index,
  isSelectAll = false,
  multiple,
  highlightedIndex,
  isSelected,
  isAllSelected,
  onSelect,
  onToggleSelectAll,
}: SelectOptionItemProps) {
  const selected = isSelectAll ? isAllSelected : option ? isSelected(option.value) : false;
  const highlighted = !isSelectAll && index !== undefined && highlightedIndex === index;
  const disabled = !isSelectAll && !!option?.disabled;
  const label = isSelectAll ? "전체 선택" : option?.label ?? "";

  const handleClick = () => {
    if (isSelectAll) {
      onToggleSelectAll();
      return;
    }
    if (option && !option.disabled) {
      onSelect(option);
    }
  };

  const classes = [
    "flex shrink-0 items-center gap-2 h-10 px-4 rounded-sm",
    "cursor-pointer text-sm font-normal leading-[140%]",
    "transition-[background-color,color] duration-150 ease-in-out",
    disabled
      ? "cursor-not-allowed opacity-50"
      : highlighted
        ? "bg-gray-100 text-gray-700"
        : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 active:text-gray-800",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-highlighted={highlighted || undefined}
      className={classes}
      onClick={handleClick}
    >
      {multiple && (
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          readOnly
          className="w-4 h-4 rounded border-gray-300 text-blue-500 pointer-events-none accent-blue-500"
          tabIndex={-1}
        />
      )}
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {label}
      </span>
      {!multiple && selected && (
        <span className="shrink-0 text-blue-500">
          <CheckIcon />
        </span>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// AppSelect (Main Component)
// ---------------------------------------------------------------------------

export default function AppSelect({
  options = [],
  value,
  onChange,
  size = "md",
  placeholder = "선택해주세요",
  disabled = false,
  state = "default",
  multiple = false,
  showSelectAll = false,
  width,
  fullWidth = false,
  hint,
  id: propId,
  ariaDescribedby,
  className = "",
}: AppSelectProps) {
  const reactId = useId();
  const computedId = propId || `app-select-${reactId}`;
  const listboxId = `${computedId}-listbox`;
  const hintId = hint ? `${computedId}-hint` : undefined;

  // --- State ---
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [dropdownPosition, setDropdownPosition] = useState<"top" | "bottom">("bottom");

  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // --- Computed State ---
  const computedState: ComputedState = useMemo(() => {
    if (disabled) return "disabled";
    if (state === "error" && (isFocused || isOpen)) return "error-focused";
    if (state === "error") return "error";
    if (isFocused || isOpen) return "focused";
    return "default";
  }, [disabled, state, isFocused, isOpen]);

  // --- Derived values ---
  const selectedOptions = useMemo(() => {
    if (value === null || value === undefined) return [];
    const values = Array.isArray(value) ? value : [value];
    return options.filter((opt) => values.includes(opt.value));
  }, [value, options]);

  const displayText = useMemo(() => {
    if (selectedOptions.length === 0) return "";
    if (!multiple) return selectedOptions[0]?.label || "";
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions[0].label} 외 ${selectedOptions.length - 1}건`;
  }, [selectedOptions, multiple]);

  const hasValue = useMemo(() => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  }, [value]);

  const selectableOptions = useMemo(
    () => options.filter((opt) => !opt.disabled),
    [options],
  );

  const isAllSelected = useMemo(() => {
    if (!multiple || selectableOptions.length === 0) return false;
    const currentValues = Array.isArray(value) ? value : [];
    return selectableOptions.every((opt) => currentValues.includes(opt.value));
  }, [multiple, selectableOptions, value]);

  // --- Selection helpers ---
  const isSelected = useCallback(
    (v: SelectValue) => {
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) return value.includes(v);
      return value === v;
    },
    [value],
  );

  // --- Dropdown actions ---
  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const toggleDropdown = useCallback(() => {
    if (isOpen) closeDropdown();
    else openDropdown();
  }, [isOpen, closeDropdown, openDropdown]);

  // --- Select an option ---
  const selectOption = useCallback(
    (option: SelectOption) => {
      if (option.disabled) return;

      if (multiple) {
        const currentValues = Array.isArray(value) ? [...value] : [];
        const idx = currentValues.indexOf(option.value);
        if (idx === -1) {
          currentValues.push(option.value);
        } else {
          currentValues.splice(idx, 1);
        }
        onChange?.(currentValues);
      } else {
        onChange?.(option.value);
        closeDropdown();
      }
    },
    [multiple, value, onChange, closeDropdown],
  );

  // --- Select All toggle ---
  const toggleSelectAll = useCallback(() => {
    if (!multiple) return;

    if (isAllSelected) {
      const disabledValues = options
        .filter((opt) => opt.disabled)
        .map((opt) => opt.value);
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.filter((v) => disabledValues.includes(v));
      onChange?.(newValues);
    } else {
      const currentValues = Array.isArray(value) ? [...value] : [];
      const newValues = [
        ...new Set([...currentValues, ...selectableOptions.map((opt) => opt.value)]),
      ];
      onChange?.(newValues);
    }
  }, [multiple, isAllSelected, options, selectableOptions, value, onChange]);

  // --- Keyboard navigation ---
  const scrollToHighlighted = useCallback(() => {
    requestAnimationFrame(() => {
      const el = listboxRef.current?.querySelector('[data-highlighted="true"]');
      el?.scrollIntoView({ block: "nearest" });
    });
  }, []);

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            selectOption(options[highlightedIndex]);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else {
            setHighlightedIndex((prev) => {
              const next = Math.min(prev + 1, options.length - 1);
              return next;
            });
            setTimeout(scrollToHighlighted, 0);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
            setTimeout(scrollToHighlighted, 0);
          }
          break;
        case "Home":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex(0);
            setTimeout(scrollToHighlighted, 0);
          }
          break;
        case "End":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex(options.length - 1);
            setTimeout(scrollToHighlighted, 0);
          }
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          triggerRef.current?.focus();
          break;
        case "Tab":
          closeDropdown();
          break;
      }
    },
    [isOpen, highlightedIndex, options, openDropdown, closeDropdown, selectOption, scrollToHighlighted],
  );

  // --- Click outside ---
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        listboxRef.current?.contains(target)
      )
        return;
      closeDropdown();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeDropdown]);

  // --- Scroll close (except listbox internal scroll) ---
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (listboxRef.current?.contains(target)) return;
      closeDropdown();
    };
    window.addEventListener("scroll", handleScroll, { capture: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [isOpen, closeDropdown]);

  // --- Dropdown positioning ---
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const pos = spaceBelow < 200 ? "top" : "bottom";
      setDropdownPosition(pos);
      setDropdownStyle({
        position: "fixed",
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        ...(pos === "bottom"
          ? { top: `${rect.bottom}px` }
          : { bottom: `${window.innerHeight - rect.top}px` }),
        zIndex: 10000,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isOpen]);

  // --- Classes ---
  const containerClasses = [
    "relative inline-flex flex-wrap",
    fullWidth || !width ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const containerStyle: CSSProperties | undefined =
    width && !fullWidth ? { width, flexShrink: 0 } : undefined;

  const triggerClasses = [
    "flex items-center justify-between gap-2 w-full",
    "border rounded-[6px] cursor-pointer text-left",
    "transition-[border-color,background-color] duration-150 ease-in-out",
    "outline-none focus-visible:border-blue-500",
    triggerSizeClasses[size],
    triggerStateClasses[computedState],
  ]
    .filter(Boolean)
    .join(" ");

  const valueColors = valueColorMap[computedState];
  const valueClasses = [
    "flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal",
    hasValue ? valueColors.value : valueColors.placeholder,
  ].join(" ");

  const arrowClasses = [
    "shrink-0 transition-transform duration-200 ease-in-out",
    arrowColorMap[computedState],
  ].join(" ");

  const listboxClasses = [
    "flex flex-col gap-0.5 m-0 p-1 list-none",
    "bg-white border border-gray-400 rounded-[6px]",
    "shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
    "max-h-[194px] overflow-y-auto scrollbar-hide",
    dropdownPosition === "bottom" ? "mt-1" : "mb-1",
  ].join(" ");

  // --- Render ---
  return (
    <div ref={containerRef} className={containerClasses} style={containerStyle}>
      <button
        id={computedId}
        ref={triggerRef}
        type="button"
        role="combobox"
        className={triggerClasses}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-describedby={ariaDescribedby || hintId}
        aria-invalid={state === "error" ? "true" : undefined}
        onClick={toggleDropdown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeydown}
      >
        <span className={valueClasses}>
          {hasValue ? displayText : placeholder}
        </span>
        <span className={arrowClasses}>
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </button>

      {isOpen &&
        createPortal(
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            className={listboxClasses}
            style={dropdownStyle}
            aria-multiselectable={multiple ? "true" : undefined}
          >
            {multiple && showSelectAll && selectableOptions.length > 0 && (
              <SelectOptionItem
                isSelectAll
                multiple={multiple}
                highlightedIndex={highlightedIndex}
                isSelected={isSelected}
                isAllSelected={isAllSelected}
                onSelect={selectOption}
                onToggleSelectAll={toggleSelectAll}
              />
            )}
            {options.map((option, index) => (
              <SelectOptionItem
                key={option.value}
                option={option}
                index={index}
                multiple={multiple}
                highlightedIndex={highlightedIndex}
                isSelected={isSelected}
                isAllSelected={isAllSelected}
                onSelect={selectOption}
                onToggleSelectAll={toggleSelectAll}
              />
            ))}
          </ul>,
          document.body,
        )}

      {hint && state === "error" && (
        <span id={hintId} className="w-full mt-2 text-sm text-red-500">
          {hint}
        </span>
      )}
    </div>
  );
}
