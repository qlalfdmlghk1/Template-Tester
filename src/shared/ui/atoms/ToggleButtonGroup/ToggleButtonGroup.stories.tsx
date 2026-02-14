import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ToggleButtonGroup from "./ToggleButtonGroup";

const sampleOptions = [
  { value: "all", label: "전체" },
  { value: "active", label: "활성" },
  { value: "inactive", label: "비활성" },
];

const manyOptions = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "solid", label: "Solid" },
];

const meta: Meta<typeof ToggleButtonGroup> = {
  title: "shared/ui/atoms/ToggleButtonGroup",
  component: ToggleButtonGroup,
  argTypes: {
    multiple: { control: "boolean", description: "다중 선택 모드" },
  },
  args: {
    options: sampleOptions,
    multiple: false,
  },
};

export default meta;
type Story = StoryObj<typeof ToggleButtonGroup>;

// --- 단일 선택 ---

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | string[]>("all");
    return <ToggleButtonGroup {...args} value={value} onChange={setValue} />;
  },
};

export const NoneSelected: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | string[]>("");
    return <ToggleButtonGroup {...args} value={value} onChange={setValue} />;
  },
};

// --- 다중 선택 ---

export const Multiple: Story = {
  args: { multiple: true, options: manyOptions },
  render: (args) => {
    const [value, setValue] = useState<string | string[]>(["react", "vue"]);
    return (
      <div className="flex flex-col gap-3">
        <ToggleButtonGroup {...args} value={value} onChange={setValue} />
        <p className="text-sm text-gray-500">
          선택: {Array.isArray(value) ? value.join(", ") : value}
        </p>
      </div>
    );
  },
};

export const MultipleNoneSelected: Story = {
  args: { multiple: true, options: manyOptions },
  render: (args) => {
    const [value, setValue] = useState<string | string[]>([]);
    return <ToggleButtonGroup {...args} value={value} onChange={setValue} />;
  },
};

// --- 옵션 수 ---

export const ManyOptions: Story = {
  args: { options: manyOptions },
  render: (args) => {
    const [value, setValue] = useState<string | string[]>("react");
    return <ToggleButtonGroup {...args} value={value} onChange={setValue} />;
  },
};
