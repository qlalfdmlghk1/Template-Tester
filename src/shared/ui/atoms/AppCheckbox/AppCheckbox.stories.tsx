import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppCheckbox from "./AppCheckbox";

const meta: Meta<typeof AppCheckbox> = {
  title: "shared/ui/atoms/AppCheckbox",
  component: AppCheckbox,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text", description: "상자 옆 문구 (노드 가능). 비우면 aria-label로 이름" },
    description: { control: "text", description: "문구 아래 작은 설명" },
    indeterminate: { control: "boolean", description: "일부만 선택됨(–) — 전체 선택 상자" },
    disabled: { control: "boolean", description: "비활성화" },
  },
};

export default meta;
type Story = StoryObj<typeof AppCheckbox>;

function ControlledDemo(props: Partial<React.ComponentProps<typeof AppCheckbox>>) {
  const [checked, setChecked] = useState(false);
  return <AppCheckbox {...props} checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
}

export const Default: Story = {
  render: () => <ControlledDemo label="다른 사용자에게 공유하기" />,
  parameters: {
    docs: {
      source: { code: `<AppCheckbox label="다른 사용자에게 공유하기" checked={share} onChange={(e) => setShare(e.target.checked)} />` },
    },
  },
};

export const WithDescription: Story = {
  render: () => (
    <ControlledDemo
      label="이 기업의 지원 건 3건도 함께 삭제"
      description="체크하지 않으면 지원 건은 남지만 기업 정보가 끊겨 「(삭제된 기업)」으로 표시됩니다."
    />
  ),
  parameters: { docs: { source: { code: `<AppCheckbox label="..." description="..." checked={v} onChange={...} />` } } },
};

export const Indeterminate: Story = {
  render: () => <AppCheckbox aria-label="전체 선택" indeterminate checked={false} onChange={() => {}} />,
  parameters: {
    docs: {
      description: { story: "표의 전체 선택 상자에서 일부만 골랐을 때" },
      source: { code: `<AppCheckbox aria-label="전체 선택" checked={all} indeterminate={!all && some} onChange={...} />` },
    },
  },
};

export const Disabled: Story = {
  render: () => <AppCheckbox label="비활성" disabled checked onChange={() => {}} />,
  parameters: { docs: { source: { code: `<AppCheckbox label="비활성" disabled checked />` } } },
};
