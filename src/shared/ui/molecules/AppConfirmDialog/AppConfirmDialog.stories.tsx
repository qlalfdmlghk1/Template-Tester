import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppConfirmDialog from "./AppConfirmDialog";
import AppButton from "../../atoms/AppButton/AppButton";

const meta: Meta<typeof AppConfirmDialog> = {
  title: "shared/ui/molecules/AppConfirmDialog",
  component: AppConfirmDialog,
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean", description: "열림 여부" },
    title: { control: "text", description: "제목" },
    description: { control: "text", description: "부연 설명" },
    confirmText: { control: "text", description: "확인 버튼 문구" },
    cancelText: { control: "text", description: "취소 버튼 문구" },
    danger: {
      control: "boolean",
      description: "삭제처럼 되돌리기 어려운 동작이면 확인 버튼을 경고색으로",
    },
    loading: { control: "boolean", description: "확인 처리 중" },
  },
};

export default meta;
type Story = StoryObj<typeof AppConfirmDialog>;

export const Default: Story = {
  args: {
    open: true,
    title: "변경 사항을 저장할까요?",
    description: "저장하지 않으면 입력한 내용이 사라집니다.",
    confirmText: "저장",
  },
  parameters: {
    docs: {
      source: {
        code: `<AppConfirmDialog open title="변경 사항을 저장할까요?" onConfirm={save} onCancel={close} />`,
      },
    },
  },
};

export const Danger: Story = {
  args: {
    open: true,
    title: "지원 건을 삭제할까요?",
    description: "삭제하면 전형 진행 기록도 함께 사라지며 되돌릴 수 없습니다.",
    confirmText: "삭제",
    danger: true,
  },
  parameters: {
    docs: {
      source: {
        code: `<AppConfirmDialog open danger title="지원 건을 삭제할까요?" confirmText="삭제" onConfirm={remove} onCancel={close} />`,
      },
    },
  },
};

export const Loading: Story = {
  args: {
    open: true,
    title: "지원 건을 삭제할까요?",
    confirmText: "삭제",
    danger: true,
    loading: true,
  },
  parameters: {
    docs: {
      source: {
        code: `<AppConfirmDialog open danger loading title="지원 건을 삭제할까요?" ... />`,
      },
    },
  },
};

function InteractiveDemo() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("아직 아무것도 하지 않았습니다.");

  return (
    <div className="flex flex-col gap-3">
      <AppButton size="sm" color="red" onClick={() => setOpen(true)}>
        삭제
      </AppButton>
      <p className="m-0 text-sm text-textSecondary">{message}</p>

      <AppConfirmDialog
        open={open}
        danger
        title="지원 건을 삭제할까요?"
        description="삭제하면 되돌릴 수 없습니다."
        confirmText="삭제"
        onConfirm={() => {
          setMessage("삭제했습니다.");
          setOpen(false);
        }}
        onCancel={() => {
          setMessage("취소했습니다.");
          setOpen(false);
        }}
      />
    </div>
  );
}

/** 버튼으로 열고 닫는 실제 흐름 */
export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      source: {
        code: `
const [open, setOpen] = useState(false)

<AppButton onClick={() => setOpen(true)}>삭제</AppButton>
<AppConfirmDialog
  open={open}
  danger
  title="지원 건을 삭제할까요?"
  confirmText="삭제"
  onConfirm={handleDelete}
  onCancel={() => setOpen(false)}
/>
        `.trim(),
      },
    },
  },
};
