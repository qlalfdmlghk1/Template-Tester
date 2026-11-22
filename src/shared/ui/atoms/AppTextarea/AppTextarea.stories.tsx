import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppTextarea from "./AppTextarea";

const meta: Meta<typeof AppTextarea> = {
  title: "shared/ui/atoms/AppTextarea",
  component: AppTextarea,
  tags: ["autodocs"],
  argTypes: {
    rows: { control: "number", description: "보이는 줄 수. 기본 4" },
    resize: { control: "select", options: ["vertical", "none"], description: "크기 조절 손잡이. 기본 vertical" },
    autoResize: { control: "boolean", description: "내용에 맞춰 높이를 늘림 (maxRows까지)" },
    maxRows: { control: "number", description: "autoResize 최대 줄 수" },
    showCount: { control: "boolean", description: "maxLength와 함께 글자 수 표시" },
    label: { control: "text", description: "위 라벨. 화면에 따로 라벨이 있으면 비우고 id로 연결" },
    helperText: { control: "text", description: "아래 도움말" },
    error: { control: "text", description: "에러 문구 (빨간 테두리 + aria-invalid)" },
    disabled: { control: "boolean", description: "비활성화" },
    className: { control: "text", description: "바깥 래퍼 너비·배치 클래스 (기본 w-full)" },
  },
};

export default meta;
type Story = StoryObj<typeof AppTextarea>;

function ControlledDemo(props: Partial<React.ComponentProps<typeof AppTextarea>>) {
  const [value, setValue] = useState("");
  return (
    <div className="w-96">
      <AppTextarea aria-label="메모" {...props} value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}

export const Default: Story = {
  render: () => <ControlledDemo placeholder="이 문제에서 배운 점, 주의할 점 등을 기록하세요..." />,
  parameters: {
    docs: { source: { code: `<AppTextarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="..." />` } },
  },
};

export const NoResize: Story = {
  render: () => <ControlledDemo rows={3} resize="none" placeholder="크기 조절 없음" />,
  parameters: { docs: { source: { code: `<AppTextarea rows={3} resize="none" ... />` } } },
};

export const AutoResize: Story = {
  render: () => <ControlledDemo rows={2} autoResize maxRows={6} placeholder="입력할수록 늘어남 (최대 6줄)" />,
  parameters: { docs: { source: { code: `<AppTextarea rows={2} autoResize maxRows={6} ... />` } } },
};

export const WithCount: Story = {
  render: () => <ControlledDemo maxLength={200} showCount label="메모" />,
  parameters: { docs: { source: { code: `<AppTextarea label="메모" maxLength={200} showCount ... />` } } },
};

export const Error: Story = {
  render: () => <ControlledDemo error="본문이 너무 짧습니다." />,
  parameters: { docs: { source: { code: `<AppTextarea error="본문이 너무 짧습니다." ... />` } } },
};
