import type { Meta, StoryObj } from "@storybook/react";
import PageHeader from "./PageHeader";

const meta: Meta<typeof PageHeader> = {
  title: "shared/ui/molecules/PageHeader",
  component: PageHeader,
  argTypes: {
    title: { control: "text", description: "페이지 제목" },
    description: { control: "text", description: "페이지 설명" },
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
