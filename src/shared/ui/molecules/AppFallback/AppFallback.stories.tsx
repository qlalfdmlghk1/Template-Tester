import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppFallback from "./AppFallback";

const meta: Meta<typeof AppFallback> = {
  title: "shared/ui/molecules/AppFallback",
  component: AppFallback,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["error", "empty"],
      description: "Fallback 타입",
    },
    title: {
      control: "text",
      description: "제목 (기본값: 타입별 기본 텍스트)",
    },
    description: {
      control: "text",
      description: "설명 (기본값: 타입별 기본 텍스트)",
    },
    buttonText: {
      control: "text",
      description: "버튼 텍스트 (기본값: 타입별 기본 텍스트)",
    },
    hideButton: {
      control: "boolean",
      description: "버튼 숨김 여부",
    },
  },
  args: {
    type: "error",
    hideButton: false,
  },
};

export default meta;
type Story = StoryObj<typeof AppFallback>;

export const Error: Story = {
  args: {
    type: "error",
  },
  parameters: {
    docs: {
      source: {
        code: `<AppFallback type="error" onAction={handleRetry} />`,
      },
    },
  },
};

export const Empty: Story = {
  args: {
    type: "empty",
  },
  parameters: {
    docs: {
      source: {
        code: `<AppFallback type="empty" onAction={handleReset} />`,
      },
    },
  },
};

export const CustomText: Story = {
  args: {
    type: "empty",
    title: "등록된 캠페인이 없습니다.",
    description: "새 캠페인을 등록해 주세요.",
    buttonText: "캠페인 등록",
  },
  parameters: {
    docs: {
      source: {
        code: `
<AppFallback
  type="empty"
  title="등록된 캠페인이 없습니다."
  description="새 캠페인을 등록해 주세요."
  buttonText="캠페인 등록"
  onAction={handleCreate}
/>
        `.trim(),
      },
    },
  },
};

export const WithoutButton: Story = {
  args: {
    type: "empty",
    hideButton: true,
  },
  parameters: {
    docs: {
      source: {
        code: `<AppFallback type="empty" hideButton />`,
      },
    },
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <AppFallback type="error" />
      <AppFallback type="empty" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
<AppFallback type="error" onAction={handleRetry} />
<AppFallback type="empty" onAction={handleReset} />
        `.trim(),
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [clickCount, setClickCount] = useState(0);
    const [lastAction, setLastAction] = useState("");

    return (
      <div className="flex flex-col gap-6">
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="m-0 mb-2 font-semibold">이벤트 로그</p>
          <p className="m-0 text-gray-500">클릭 횟수: {clickCount}</p>
          <p className="m-0 text-gray-500">
            마지막 액션: {lastAction || "없음"}
          </p>
        </div>
        <AppFallback
          type="error"
          onAction={() => {
            setClickCount((c) => c + 1);
            setLastAction("재시도 클릭됨");
          }}
        />
        <AppFallback
          type="empty"
          onAction={() => {
            setClickCount((c) => c + 1);
            setLastAction("검색 조건 초기화 클릭됨");
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "버튼 클릭 시 onAction 콜백이 호출되는지 확인할 수 있는 인터랙티브 데모",
      },
      source: {
        code: `
<AppFallback type="error" onAction={handleRetry} />
<AppFallback type="empty" onAction={handleReset} />
        `.trim(),
      },
    },
  },
};
