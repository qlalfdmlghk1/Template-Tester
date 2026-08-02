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
    children: {
      control: false,
      description: "설명 아래에 넣을 부가 입력 (예: 함께 삭제 체크박스)",
    },
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

function CascadeDemo() {
  const [cascade, setCascade] = useState(false);

  return (
    <AppConfirmDialog
      open
      danger
      title="기업을 삭제할까요?"
      description={'"IBK 기업은행" 의 조사 내용이 사라집니다.'}
      confirmText="삭제"
      onConfirm={() => undefined}
      onCancel={() => undefined}
    >
      <label className="flex items-start gap-2 px-3 py-2 bg-gray-100 rounded-sm cursor-pointer">
        <input
          type="checkbox"
          checked={cascade}
          onChange={(event) => setCascade(event.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm text-text">
          이 기업의 지원 건 2건도 함께 삭제
          <span className="block text-xs text-textSecondary">
            체크하지 않으면 지원 건은 남지만 기업 정보가 끊깁니다.
          </span>
        </span>
      </label>
    </AppConfirmDialog>
  );
}

/** 설명 아래에 부가 입력을 넣는 경우 */
export const WithExtraInput: Story = {
  render: () => <CascadeDemo />,
  parameters: {
    docs: {
      source: {
        code: `
<AppConfirmDialog open danger title="기업을 삭제할까요?" confirmText="삭제" ...>
  <label>
    <input type="checkbox" checked={cascade} onChange={...} />
    이 기업의 지원 건 2건도 함께 삭제
  </label>
</AppConfirmDialog>
        `.trim(),
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
