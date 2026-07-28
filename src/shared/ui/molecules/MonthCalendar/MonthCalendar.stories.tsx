import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import MonthCalendar from "./MonthCalendar";

const meta: Meta<typeof MonthCalendar> = {
  title: "shared/ui/molecules/MonthCalendar",
  component: MonthCalendar,
  argTypes: {
    year: { control: "number", description: "표시할 연도" },
    month: { control: "number", description: "표시할 월 (1~12)" },
    selectedDateKey: { control: "text", description: "선택된 날짜 키 (YYYY-MM-DD)" },
    todayKey: { control: "text", description: "오늘로 표시할 날짜 키" },
    onSelectDate: { action: "selectDate", description: "날짜 클릭" },
    onChangeMonth: { action: "changeMonth", description: "월 이동" },
    renderDayContent: { control: false, description: "날짜 칸 아래 렌더링할 내용" },
  },
  args: {
    year: 2026,
    month: 7,
    todayKey: "2026-07-26",
  },
  decorators: [
    (Story) => (
      <div className="max-w-[520px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MonthCalendar>;

// --- 기본 ---

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: `<MonthCalendar year={2026} month={7} onSelectDate={handleSelect} />`,
      },
    },
  },
};

export const Selected: Story = {
  args: { selectedDateKey: "2026-07-15" },
  parameters: {
    docs: {
      source: {
        code: `<MonthCalendar year={2026} month={7} selectedDateKey="2026-07-15" />`,
      },
    },
  },
};

// --- 경계 케이스 ---

export const FebruaryLeapYear: Story = {
  name: "윤년 2월",
  args: { year: 2028, month: 2, todayKey: "2028-02-29" },
  parameters: {
    docs: {
      source: { code: `<MonthCalendar year={2028} month={2} />` },
    },
  },
};

export const YearEnd: Story = {
  name: "연말 (다음 해로 이어짐)",
  args: { year: 2026, month: 12, todayKey: "2026-12-25" },
  parameters: {
    docs: {
      source: { code: `<MonthCalendar year={2026} month={12} />` },
    },
  },
};

// --- 날짜 칸 커스텀 ---

const SAMPLE_COUNTS: Record<string, number> = {
  "2026-07-06": 1,
  "2026-07-08": 3,
  "2026-07-15": 2,
  "2026-07-20": 5,
  "2026-07-26": 2,
};

export const WithDayContent: Story = {
  name: "날짜 칸에 내용 표시",
  args: {
    renderDayContent: (dateKey: string) => {
      const count = SAMPLE_COUNTS[dateKey];
      if (!count) return null;

      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-primary font-medium">
          {count}문제
        </span>
      );
    },
  },
  parameters: {
    docs: {
      source: {
        code: `<MonthCalendar
  year={2026}
  month={7}
  renderDayContent={(dateKey) => <Badge count={countsByDate[dateKey]} />}
/>`,
      },
    },
  },
};

// --- 상호작용 ---

/** 훅을 쓰려면 스토리 render가 아니라 컴포넌트 안이어야 한다 (react-hooks/rules-of-hooks) */
function InteractiveCalendar(args: React.ComponentProps<typeof MonthCalendar>) {
  const [cursor, setCursor] = useState({ year: 2026, month: 7 });
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <MonthCalendar
        {...args}
        year={cursor.year}
        month={cursor.month}
        selectedDateKey={selected}
        onSelectDate={setSelected}
        onChangeMonth={(year, month) => setCursor({ year, month })}
      />
      <p className="text-sm text-textSecondary">선택: {selected ?? "없음"}</p>
    </div>
  );
}

export const Interactive: Story = {
  name: "월 이동 + 날짜 선택",
  render: (args) => <InteractiveCalendar {...args} />,
  parameters: {
    docs: {
      source: {
        code: `const [cursor, setCursor] = useState({ year: 2026, month: 7 })
const [selected, setSelected] = useState<string | null>(null)

<MonthCalendar
  year={cursor.year}
  month={cursor.month}
  selectedDateKey={selected}
  onSelectDate={setSelected}
  onChangeMonth={(year, month) => setCursor({ year, month })}
/>`,
      },
    },
  },
};
