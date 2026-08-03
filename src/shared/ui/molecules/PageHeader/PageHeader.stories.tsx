import type { Meta, StoryObj } from "@storybook/react";
import PageHeader from "./PageHeader";

const meta: Meta<typeof PageHeader> = {
  title: "shared/ui/molecules/PageHeader",
  component: PageHeader,
  argTypes: {
    title: { control: "text", description: "페이지 제목" },
    description: { control: "text", description: "페이지 설명" },
    actions: {
      control: false,
      description: "제목 오른쪽에 붙는 액션 영역. 좁은 폭에서는 다음 줄로 넘어간다",
    },
  },
  args: {
    title: "페이지 제목",
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

// --- 기본 ---

export const Default: Story = {};

// --- 변형 ---

export const WithDescription: Story = {
  args: {
    title: "사용자 관리",
    description: "시스템에 등록된 사용자를 관리합니다.",
  },
};

export const WithActions: Story = {
  args: {
    title: "매체 관리",
    description: "광고 매체와 상품을 관리합니다.",
    actions: (
      <div className="flex gap-2">
        <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md">
          매체 추가
        </button>
        <button className="px-4 py-2 text-sm border border-gray-300 rounded-md">
          내보내기
        </button>
      </div>
    ),
  },
};

/** 좁은 폭에서 액션이 제목 옆에 눌리지 않고 다음 줄로 넘어가는지 확인하는 스토리 */
export const ActionsOnMobile: Story = {
  args: {
    title: "채용",
    description: "지원 현황을 전형 단계별로 관리하고, 비채용기간에는 관심 기업을 미리 조사합니다.",
    actions: (
      <div className="flex flex-wrap gap-2 ml-auto">
        <button className="px-3 py-1.5 text-sm text-red-500 rounded-md">전체 삭제</button>
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-md">
          시트 가져오기
        </button>
        <button className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md">
          지원 건 추가
        </button>
      </div>
    ),
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    docs: {
      source: {
        code: `<PageHeader
  title="채용"
  description="지원 현황을 전형 단계별로 관리하고, 비채용기간에는 관심 기업을 미리 조사합니다."
  actions={
    <div className="flex flex-wrap gap-2 ml-auto">
      <AppButton variant="ghost" color="red" size="sm">전체 삭제</AppButton>
      <AppButton variant="outline" color="gray" size="sm">시트 가져오기</AppButton>
      <AppButton size="sm">지원 건 추가</AppButton>
    </div>
  }
/>`,
      },
    },
  },
};

export const TitleOnly: Story = {
  args: {
    title: "대시보드",
  },
};

export const LongTitle: Story = {
  args: {
    title: "캠페인 운영 리포트 상세 분석 페이지",
    description:
      "캠페인의 성과 데이터를 기간별, 매체별로 상세하게 분석할 수 있습니다. 필터를 사용하여 원하는 데이터를 조회하세요.",
  },
};
