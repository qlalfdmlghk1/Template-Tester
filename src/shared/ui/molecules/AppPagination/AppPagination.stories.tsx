import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppPagination from "./AppPagination";

const meta: Meta<typeof AppPagination> = {
  title: "shared/ui/molecules/AppPagination",
  component: AppPagination,
  tags: ["autodocs"],
  argTypes: {
    currentPage: { control: { type: "number", min: 1 }, description: "현재 페이지 (1부터)" },
    totalPages: { control: { type: "number", min: 0 }, description: "전체 페이지 수. 1 이하이고 크기 선택도 없으면 그리지 않음" },
    pageSize: { control: "number", description: "페이지당 개수 (크기 선택의 현재 값)" },
    onPageChange: { description: "페이지 번호·이전·다음을 누르면 그 페이지 번호로 호출" },
    onPageSizeChange: { description: "넘기면 왼쪽에 페이지당 개수 선택을 보여준다. 고른 값을 number로 호출" },
    pageSizeOptions: { control: "object", description: "페이지당 개수 선택지. 기본 [10, 20, 50]" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "DS `AppPagination` 어댑터. 현재 페이지 양옆 2개까지 번호를 보이고 나머지는 …로 줄인다. 이전·다음은 화살표 아이콘 버튼.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppPagination>;

function PaginationPreview({ totalPages, withPageSize = false }: { totalPages: number; withPageSize?: boolean }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  return (
    <AppPagination
      currentPage={page}
      totalPages={totalPages}
      pageSize={size}
      onPageChange={setPage}
      onPageSizeChange={withPageSize ? setSize : undefined}
    />
  );
}

export const Default: Story = {
  render: () => <PaginationPreview totalPages={5} />,
  parameters: {
    docs: {
      source: {
        code: `<AppPagination currentPage={page} totalPages={5} pageSize={10} onPageChange={setPage} />`,
      },
    },
  },
};

export const Ellipsis: Story = {
  render: () => <PaginationPreview totalPages={20} />,
  parameters: {
    docs: {
      description: { story: "페이지가 많으면 첫·끝 페이지와 현재 페이지 양옆 2개만 보이고 나머지는 …로 줄인다." },
      source: {
        code: `<AppPagination currentPage={page} totalPages={20} pageSize={10} onPageChange={setPage} />`,
      },
    },
  },
};

export const WithPageSize: Story = {
  render: () => <PaginationPreview totalPages={8} withPageSize />,
  parameters: {
    docs: {
      description: { story: "`onPageSizeChange`를 넘기면 왼쪽에 페이지당 개수 선택이 생긴다." },
      source: {
        code: `<AppPagination
  currentPage={page}
  totalPages={8}
  pageSize={size}
  onPageChange={setPage}
  onPageSizeChange={setSize}
/>`,
      },
    },
  },
};
