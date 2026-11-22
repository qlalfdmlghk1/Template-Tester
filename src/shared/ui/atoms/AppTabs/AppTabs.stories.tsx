import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppTabs from "./AppTabs";

const meta: Meta<typeof AppTabs> = {
  title: "shared/ui/atoms/AppTabs",
  component: AppTabs,
  tags: ["autodocs"],
  argTypes: {
    items: { control: "object", description: "탭 목록 { value, label, count?, disabled? }" },
    value: { control: "text", description: "지금 탭. items에 없으면 선택된 탭 없음" },
    ariaLabel: { control: "text", description: "탭 목록의 스크린리더 이름" },
    actions: { control: false, description: "탭 줄 오른쪽 끝 버튼 등" },
  },
};

export default meta;
type Story = StoryObj<typeof AppTabs>;

function Demo({ withActions = false }: { withActions?: boolean }) {
  const [tab, setTab] = useState("list");
  return (
    <div className="w-[640px]">
      <AppTabs
        ariaLabel="오답노트 보기"
        items={[
          { value: "list", label: "목록" },
          { value: "friends", label: "친구 오답노트" },
          { value: "archived", label: "보관함", count: 3 },
        ]}
        value={tab}
        onChange={setTab}
        actions={
          withActions ? (
            <button type="button" className="px-3 h-8 text-sm border border-border rounded-md" onClick={() => setTab("write")}>
              + 작성
            </button>
          ) : undefined
        }
      />
      <p className="mt-4 text-sm text-textSecondary">지금 탭: {tab}</p>
    </div>
  );
}

export const Default: Story = {
  render: () => <Demo />,
  parameters: {
    docs: {
      source: {
        code: `<AppTabs
  ariaLabel="오답노트 보기"
  items={[{ value: "list", label: "목록" }, { value: "friends", label: "친구 오답노트" }]}
  value={activeTab}
  onChange={setActiveTab}
/>`,
      },
    },
  },
};

export const WithActions: Story = {
  render: () => <Demo withActions />,
  parameters: {
    docs: {
      description: { story: "탭 줄 오른쪽 버튼. 버튼으로 연 화면(작성 등)처럼 items에 없는 값이면 선택된 탭이 없다." },
      source: { code: `<AppTabs items={...} value={activeTab} onChange={setActiveTab} actions={<AppButton size="sm">+ 작성</AppButton>} />` },
    },
  },
};
