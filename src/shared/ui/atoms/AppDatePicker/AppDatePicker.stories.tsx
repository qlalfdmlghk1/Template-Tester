import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppDatePicker from "./AppDatePicker";

const meta: Meta<typeof AppDatePicker> = {
  title: "shared/ui/atoms/AppDatePicker",
  component: AppDatePicker,
  tags: ["autodocs"],
  argTypes: {
    value: { control: "text", description: "'YYYY-MM-DD'. 빈 문자열이면 선택 안 됨" },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "높이. sm 32 · md 40 · lg 48px — AppSelect·AppTextInput과 같은 기준",
    },
    placeholder: { control: "text", description: "선택 전 문구" },
    min: { control: "text", description: "고를 수 있는 가장 이른 날짜" },
    max: { control: "text", description: "고를 수 있는 가장 늦은 날짜" },
    label: { control: "text", description: "위 라벨" },
    ariaLabel: { control: "text", description: "화면 라벨이 없을 때 스크린리더용 이름. 트리거가 '이름, 현재 값'으로 읽힌다" },
    ariaLabelledby: { control: "text", description: "이름이 되는 바깥 라벨 요소의 id (ariaLabel보다 우선)" },
    clearable: { control: "boolean", description: "값이 있을 때 옆에 지우기 버튼. 누르면 onChange(\"\")" },
    portal: { control: "boolean", description: "달력을 document.body에 띄움 — 모달 안 스크롤 영역에서 잘릴 때" },
    error: { control: "text", description: "에러 문구" },
    disabled: { control: "boolean", description: "비활성화" },
    align: { control: "select", options: ["start", "end"], description: "달력 정렬" },
    className: { control: "text", description: "바깥 래퍼에 붙는 너비·배치 클래스 (기본 w-full)" },
  },
};

export default meta;
type Story = StoryObj<typeof AppDatePicker>;

function ControlledDemo({ initial, ...rest }: { initial: string } & Partial<React.ComponentProps<typeof AppDatePicker>>) {
  const [value, setValue] = useState(initial);

  return (
    <div className="flex flex-col gap-2 w-72">
      <AppDatePicker {...rest} value={value} onChange={setValue} />
      <p className="m-0 text-xs text-textSecondary">값: {value || "(없음)"}</p>
    </div>
  );
}

export const Default: Story = {
  render: () => <ControlledDemo initial="" placeholder="날짜 선택" />,
  parameters: {
    docs: {
      source: {
        code: `<AppDatePicker value={date} onChange={setDate} placeholder="날짜 선택" />`,
      },
    },
  },
};

export const WithValue: Story = {
  render: () => <ControlledDemo initial="2026-11-22" />,
  parameters: {
    docs: {
      source: {
        code: `<AppDatePicker value="2026-11-22" onChange={setDate} />`,
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ControlledDemo initial="" size="sm" placeholder="sm 32px" />
      <ControlledDemo initial="" size="md" placeholder="md 40px" />
      <ControlledDemo initial="" size="lg" placeholder="lg 48px" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<AppDatePicker size="sm" ... />  // 32px\n<AppDatePicker size="md" ... />  // 40px (기본)`,
      },
    },
  },
};

export const MinMax: Story = {
  render: () => <ControlledDemo initial="" min="2026-11-01" max="2026-11-30" placeholder="11월 안에서만" />,
  parameters: {
    docs: {
      source: {
        code: `<AppDatePicker value={date} onChange={setDate} min="2026-11-01" max="2026-11-30" />`,
      },
    },
  },
};

export const Disabled: Story = {
  render: () => <ControlledDemo initial="2026-11-22" disabled />,
  parameters: {
    docs: {
      source: {
        code: `<AppDatePicker value={date} onChange={setDate} disabled />`,
      },
    },
  },
};

export const Clearable: Story = {
  render: () => <ControlledDemo initial="2026-11-22" ariaLabel="종료일" clearable />,
  parameters: {
    docs: {
      description: { story: "값이 있으면 오른쪽에 지우기 버튼이 생긴다. 미정으로 되돌릴 수 있어야 하는 날짜(채용 일정 등)에 쓴다." },
      source: {
        code: `<AppDatePicker value={end} onChange={setEnd} ariaLabel="종료일" clearable />`,
      },
    },
  },
};

export const LabelledBy: Story = {
  render: () => (
    <div className="flex flex-col gap-1 w-72">
      <label id="story-date-label" htmlFor="story-date" className="text-sm font-medium text-text">
        날짜
      </label>
      <ControlledDemo initial="" id="story-date" ariaLabelledby="story-date-label" />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: "DS 트리거는 버튼이라 `<label htmlFor>`만으로는 이름이 붙지 않는다. 라벨에 id를 주고 ariaLabelledby로 연결한다." },
      source: {
        code: `<label id="date-label" htmlFor="date">날짜</label>
<AppDatePicker id="date" ariaLabelledby="date-label" value={date} onChange={setDate} />`,
      },
    },
  },
};
