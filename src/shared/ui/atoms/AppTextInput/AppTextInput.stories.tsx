import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppTextInput from "./AppTextInput";
import AppSelect from "../AppSelect/AppSelect";

const meta: Meta<typeof AppTextInput> = {
  title: "shared/ui/atoms/AppTextInput",
  component: AppTextInput,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "높이. sm 32 · md 40 · lg 48px — AppSelect와 같은 기준",
    },
    type: {
      control: "select",
      options: ["text", "password", "url", "number", "search", "email"],
      description: "input type",
    },
    label: { control: "text", description: "입력창 위 라벨. 화면에 별도 라벨이 있으면 비우고 id로 연결" },
    placeholder: { control: "text", description: "플레이스홀더" },
    helperText: { control: "text", description: "아래 도움말 (error가 있으면 error가 대신 보임)" },
    error: { control: "text", description: "에러 문구. 빨간 테두리 + aria-invalid" },
    disabled: { control: "boolean", description: "비활성화" },
    className: { control: "text", description: "바깥 래퍼에 붙는 너비·배치 클래스 (기본 w-full)" },
  },
  args: {
    size: "md",
    type: "text",
    placeholder: "입력하세요",
  },
};

export default meta;
type Story = StoryObj<typeof AppTextInput>;

export const Default: Story = {
  args: { label: "문제 이름", placeholder: "예) 두 수의 합" },
  parameters: {
    docs: {
      source: {
        code: `<AppTextInput label="문제 이름" placeholder="예) 두 수의 합" value={title} onChange={(e) => setTitle(e.target.value)} />`,
      },
    },
  },
};

export const WithExternalLabel: Story = {
  render: (args) => (
    <div>
      <label htmlFor="problem-link" className="block mb-2 text-sm font-medium text-text">
        문제 링크
      </label>
      <AppTextInput {...args} id="problem-link" type="url" placeholder="https://" />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: "화면에 라벨이 따로 있으면 label prop 대신 id로 연결합니다." },
      source: {
        code: `
<label htmlFor="problem-link">문제 링크</label>
<AppTextInput id="problem-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} />
        `.trim(),
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <AppTextInput size="sm" aria-label="sm" placeholder="sm 32px" />
      <AppTextInput size="md" aria-label="md" placeholder="md 40px" />
      <AppTextInput size="lg" aria-label="lg" placeholder="lg 48px" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<AppTextInput size="sm" />  // 32px\n<AppTextInput size="md" />  // 40px (기본)\n<AppTextInput size="lg" />  // 48px`,
      },
    },
  },
};

function AlignedWithSelectDemo() {
  const [keyword, setKeyword] = useState("");
  const [half, setHalf] = useState<string>("2026-H2");

  return (
    <div className="flex gap-2">
      <AppTextInput
        size="sm"
        type="search"
        aria-label="기업명 검색"
        placeholder="기업명 검색"
        className="w-48"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />
      <AppSelect
        size="sm"
        width="160px"
        options={[
          { value: "2026-H2", label: "2026 하반기" },
          { value: "2026-H1", label: "2026 상반기" },
        ]}
        value={half}
        onChange={(value) => setHalf(String(value))}
      />
    </div>
  );
}

/** 같은 size면 AppSelect와 높이가 같다 */
export const AlignedWithSelect: Story = {
  render: () => <AlignedWithSelectDemo />,
  parameters: {
    docs: {
      source: {
        code: `
<AppTextInput size="sm" type="search" className="w-48" ... />
<AppSelect size="sm" width="160px" ... />
        `.trim(),
      },
    },
  },
};

export const WithError: Story = {
  args: { label: "문제 링크", type: "url", value: "abc", error: "주소 형식이 아닙니다." },
  parameters: {
    docs: {
      source: {
        code: `<AppTextInput label="문제 링크" type="url" error="주소 형식이 아닙니다." ... />`,
      },
    },
  },
};

export const Disabled: Story = {
  args: { label: "이메일", value: "user@example.com", disabled: true },
  parameters: {
    docs: {
      source: {
        code: `<AppTextInput label="이메일" value={email} disabled />`,
      },
    },
  },
};
