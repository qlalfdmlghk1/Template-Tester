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
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "DS `AppChip`(선택형 칩) 기반 토글 묶음. 단일 선택은 켜진 칩을 다시 누르면 해제되고, multiple이면 여러 개를 켜고 끈다. 켜진 칩은 체크 표시 + aria-pressed.",
      },
    },
  },
  argTypes: {
    multiple: { control: "boolean", description: "다중 선택 모드" },
    ariaLabelledby: { control: "text", description: "묶음 이름이 되는 바깥 라벨 요소의 id" },
    ariaLabel: { control: "text", description: "화면 라벨이 없을 때 스크린리더용 묶음 이름" },
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
  parameters: {
    docs: { source: { code: `<ToggleButtonGroup ariaLabelledby="result-label" options={options} value={result} onChange={setResult} />` } },
  },
};

export const NoneSelected: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | string[]>("");
    return <ToggleButtonGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { source: { code: `<ToggleButtonGroup options={options} value="" onChange={setResult} />  // 켜진 칩을 다시 누르면 ""로 해제` } },
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
  parameters: {
    docs: { source: { code: `<ToggleButtonGroup multiple ariaLabelledby="tags-label" options={tagOptions} value={tags} onChange={setTags} />` } },
  },
};

export const MultipleNoneSelected: Story = {
  args: { multiple: true, options: manyOptions },
  render: (args) => {
    const [value, setValue] = useState<string | string[]>([]);
    return <ToggleButtonGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { source: { code: `<ToggleButtonGroup multiple options={tagOptions} value={[]} onChange={setTags} />` } },
  },
};

// --- 옵션 수 ---

export const ManyOptions: Story = {
  args: { options: manyOptions },
  render: (args) => {
    const [value, setValue] = useState<string | string[]>("react");
    return <ToggleButtonGroup {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    docs: { source: { code: `<ToggleButtonGroup options={manyOptions} value={selected} onChange={setSelected} />  // 넘치면 줄바꿈` } },
  },
};
