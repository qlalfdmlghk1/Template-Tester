import type { Meta, StoryObj } from "@storybook/react";
import AppButton from "./AppButton";

const meta: Meta<typeof AppButton> = {
  title: "shared/ui/atoms/AppButton",
  component: AppButton,
  argTypes: {
    variant: {
      control: "select",
      options: ["solid", "outline", "ghost"],
      description: "버튼 스타일 변형",
    },
    color: {
      control: "select",
      options: ["primary", "gray", "red", "blue"],
      description: "버튼 색상",
    },
    size: {
      control: "select",
      options: ["lg", "md", "sm", "xs"],
      description: "버튼 크기",
    },
    disabled: { control: "boolean", description: "비활성화 상태" },
    loading: { control: "boolean", description: "로딩 상태" },
    fullWidth: { control: "boolean", description: "전체 너비" },
    width: { control: "text", description: "커스텀 너비" },
    children: { control: "text", description: "버튼 텍스트" },
  },
  args: {
    children: "버튼",
    variant: "solid",
    color: "primary",
    size: "md",
    disabled: false,
    loading: false,
    fullWidth: false,
  },
};

export default meta;
type Story = StoryObj<typeof AppButton>;

// --- 기본 ---

export const Default: Story = {};

// --- Variant ---

export const Solid: Story = {
  args: { variant: "solid", children: "Solid" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
};

// --- Color ---

export const ColorPrimary: Story = {
  args: { color: "primary", children: "Primary" },
};

export const ColorGray: Story = {
  args: { color: "gray", children: "Gray" },
};

export const ColorRed: Story = {
  args: { color: "red", children: "Red" },
};

export const ColorBlue: Story = {
  args: { color: "blue", children: "Blue" },
};

// --- Size ---

export const SizeLg: Story = {
  args: { size: "lg", children: "Large" },
};

export const SizeMd: Story = {
  args: { size: "md", children: "Medium" },
};

export const SizeSm: Story = {
  args: { size: "sm", children: "Small" },
};

export const SizeXs: Story = {
  args: { size: "xs", children: "XSmall" },
};

// --- 상태 ---

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

export const Loading: Story = {
  args: { loading: true, children: "Loading" },
};

export const FullWidth: Story = {
  args: { fullWidth: true, children: "Full Width" },
};

export const CustomWidth: Story = {
  args: { width: "240px", children: "Width 240px" },
};

// --- 아이콘 ---

const SearchIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

export const WithIconLeft: Story = {
  args: {
    iconLeft: <SearchIcon />,
    children: "검색",
  },
};

export const WithIconRight: Story = {
  args: {
    iconRight: <ArrowRightIcon />,
    children: "다음",
  },
};

export const WithBothIcons: Story = {
  args: {
    iconLeft: <SearchIcon />,
    iconRight: <ArrowRightIcon />,
    children: "검색하기",
  },
};

// --- 조합 매트릭스 ---

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["solid", "outline", "ghost"] as const).map((variant) => (
        <div key={variant}>
          <h3 className="text-sm font-medium text-gray-500 mb-2">{variant}</h3>
          <div className="flex items-center gap-3">
            {(["primary", "gray", "red", "blue"] as const).map((color) => (
              <AppButton key={color} variant={variant} color={color}>
                {color}
              </AppButton>
            ))}
            <AppButton variant={variant} disabled>
              disabled
            </AppButton>
            <AppButton variant={variant} loading>
              loading
            </AppButton>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {(["lg", "md", "sm", "xs"] as const).map((size) => (
        <AppButton key={size} size={size}>
          {size}
        </AppButton>
      ))}
    </div>
  ),
};

export const AllSizesWithIcons: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {(["lg", "md", "sm", "xs"] as const).map((size) => (
        <AppButton key={size} size={size} iconLeft={<SearchIcon />}>
          {size}
        </AppButton>
      ))}
    </div>
  ),
};
