import type { Meta, StoryObj } from "@storybook/react";
import AppToast from "./AppToast";
import AppButton from "../../atoms/AppButton/AppButton";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";

const meta: Meta<typeof AppToast> = {
  title: "shared/ui/molecules/AppToast",
  component: AppToast,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["success", "error"],
      description: "토스트 종류",
    },
    message: {
      control: "text",
      description: "표시할 문구",
    },
    onClose: {
      description: "닫기 버튼 클릭 시 콜백. 없으면 닫기 버튼이 숨겨진다",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppToast>;

export const Success: Story = {
  args: {
    type: "success",
    message: "저장했습니다.",
  },
  parameters: {
    docs: {
      source: {
        code: `<AppToast type="success" message="저장했습니다." />`,
      },
    },
  },
};

export const Error: Story = {
  args: {
    type: "error",
    message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },
  parameters: {
    docs: {
      source: {
        code: `<AppToast type="error" message="저장하지 못했습니다." />`,
      },
    },
  },
};

export const WithCloseButton: Story = {
  args: {
    type: "success",
    message: "닫기 버튼이 있는 토스트입니다.",
    onClose: () => undefined,
  },
  parameters: {
    docs: {
      source: {
        code: `<AppToast type="success" message="..." onClose={() => dismiss(id)} />`,
      },
    },
  },
};

function ToastTrigger() {
  const { showToast } = useToast();

  return (
    <div className="flex gap-2">
      <AppButton size="sm" onClick={() => showToast("저장했습니다.")}>
        성공 토스트
      </AppButton>
      <AppButton
        size="sm"
        color="red"
        onClick={() => showToast("저장하지 못했습니다.", "error")}
      >
        실패 토스트
      </AppButton>
    </div>
  );
}

/** Provider와 함께 쓰는 실제 사용 방식 — 버튼을 누르면 우하단에 쌓인다 */
export const WithProvider: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger />
    </ToastProvider>
  ),
  parameters: {
    docs: {
      source: {
        code: `
// main.tsx
<ToastProvider>
  <App />
</ToastProvider>

// 사용하는 컴포넌트
const { showToast } = useToast()
showToast("저장했습니다.")
showToast("저장하지 못했습니다.", "error")
        `.trim(),
      },
    },
  },
};
