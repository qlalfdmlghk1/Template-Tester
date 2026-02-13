import type { Meta, StoryObj } from "@storybook/react";
import AppChip from "./AppChip";

const meta: Meta<typeof AppChip> = {
  title: "shared/ui/atoms/AppChip",
  component: AppChip,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "error", "purple"],
      description: "칩 색상 변형",
    },
    children: { control: "text", description: "칩 텍스트" },
    className: { control: "text", description: "추가 CSS 클래스" },
  },
  args: {
    children: "Chip",
    variant: "primary",
  },
};

export default meta;
type Story = StoryObj<typeof AppChip>;

// --- 기본 ---

export const Default: Story = {};

// --- Variant ---

export const Primary: Story = {
  args: { variant: "primary", children: "Primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Success: Story = {
  args: { variant: "success", children: "Success" },
};

export const Warning: Story = {
  args: { variant: "warning", children: "Warning" },
};

export const Error: Story = {
  args: { variant: "error", children: "Error" },
};

export const Purple: Story = {
  args: { variant: "purple", children: "Purple" },
};

// --- 조합 매트릭스 ---

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["primary", "secondary", "success", "warning", "error", "purple"] as const).map(
        (variant) => (
          <AppChip key={variant} variant={variant}>
            {variant}
          </AppChip>
        )
      )}
    </div>
  ),
};
