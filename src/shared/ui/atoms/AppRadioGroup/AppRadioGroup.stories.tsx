import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppRadioGroup from "./AppRadioGroup";

const meta: Meta<typeof AppRadioGroup> = {
  title: "shared/ui/atoms/AppRadioGroup",
  component: AppRadioGroup,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text", description: "그룹 이름(legend)" },
    ariaLabel: { control: "text", description: "화면 라벨이 그룹 밖에 있을 때 스크린리더용 그룹 이름" },
    direction: { control: "select", options: ["vertical", "horizontal"], description: "배치. 기본 vertical" },
    disabled: { control: "boolean", description: "전체 비활성화" },
    helperText: { control: "text", description: "아래 도움말" },
    error: { control: "text", description: "에러 문구" },
  },
};

export default meta;
type Story = StoryObj<typeof AppRadioGroup>;

const TYPE_OPTIONS = [
  { value: "paragraph", label: "줄글형" },
  { value: "problem", label: "문제형" },
];

function ControlledDemo(props: Partial<React.ComponentProps<typeof AppRadioGroup>>) {
  const [value, setValue] = useState("paragraph");
  return <AppRadioGroup options={TYPE_OPTIONS} {...props} value={value} onChange={setValue} />;
}

export const Horizontal: Story = {
  render: () => <ControlledDemo ariaLabel="템플릿 형태" direction="horizontal" />,
  parameters: {
    docs: {
      source: {
        code: `<AppRadioGroup<TemplateType>
  ariaLabel="템플릿 형태"
  direction="horizontal"
  options={[{ value: "paragraph", label: "줄글형" }, { value: "problem", label: "문제형" }]}
  value={type}
  onChange={setType}
/>`,
      },
    },
  },
};

export const WithLegend: Story = {
  render: () => <ControlledDemo label="템플릿 형태" />,
  parameters: { docs: { source: { code: `<AppRadioGroup label="템플릿 형태" options={...} value={v} onChange={setV} />` } } },
};

export const Disabled: Story = {
  render: () => <ControlledDemo ariaLabel="템플릿 형태" direction="horizontal" disabled />,
  parameters: { docs: { source: { code: `<AppRadioGroup ... disabled />` } } },
};
