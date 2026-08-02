import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppSwitch from "./AppSwitch";

const meta: Meta<typeof AppSwitch> = {
  title: "shared/ui/atoms/AppSwitch",
  component: AppSwitch,
  tags: ["autodocs"],
  argTypes: {
    checked: { control: "boolean", description: "켜짐 여부" },
    label: { control: "text", description: "옆에 붙는 라벨. 누르면 함께 토글된다" },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "크기",
    },
    disabled: { control: "boolean", description: "비활성화" },
    onChange: { description: "토글 시 다음 상태를 전달" },
  },
};

export default meta;
type Story = StoryObj<typeof AppSwitch>;

export const Off: Story = {
  args: { checked: false, label: "조사 완료만" },
  parameters: {
    docs: {
      source: {
        code: `<AppSwitch checked={false} label="조사 완료만" onChange={setChecked} />`,
      },
    },
  },
};

export const On: Story = {
  args: { checked: true, label: "조사 완료만" },
  parameters: {
    docs: {
      source: {
        code: `<AppSwitch checked label="조사 완료만" onChange={setChecked} />`,
      },
    },
  },
};

export const Small: Story = {
  args: { checked: true, size: "sm", label: "작은 크기" },
  parameters: {
    docs: {
      source: {
        code: `<AppSwitch checked size="sm" label="작은 크기" onChange={setChecked} />`,
      },
    },
  },
};

export const WithoutLabel: Story = {
  args: { checked: true },
  parameters: {
    docs: {
      source: {
        code: `<AppSwitch checked onChange={setChecked} />`,
      },
    },
  },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true, label: "비활성화" },
  parameters: {
    docs: {
      source: {
        code: `<AppSwitch checked disabled label="비활성화" onChange={setChecked} />`,
      },
    },
  },
};

function InteractiveDemo() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <AppSwitch checked={checked} onChange={setChecked} label="조사 완료만" />
      <p className="m-0 text-sm text-textSecondary">
        현재 상태: {checked ? "켜짐" : "꺼짐"}
      </p>
    </div>
  );
}

/** 실제로 눌러보는 예시 */
export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      source: {
        code: `
const [onlyResearched, setOnlyResearched] = useState(false)

<AppSwitch
  checked={onlyResearched}
  onChange={setOnlyResearched}
  label="조사 완료만"
/>
        `.trim(),
      },
    },
  },
};
