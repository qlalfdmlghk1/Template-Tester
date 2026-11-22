import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppSelect from "./AppSelect";
import type { SelectOption, SelectValue } from "./AppSelect.type";

const defaultOptions: SelectOption[] = [
  { value: "option1", label: "옵션 1" },
  { value: "option2", label: "옵션 2" },
  { value: "option3", label: "옵션 3" },
  { value: "option4", label: "옵션 4" },
  { value: "option5", label: "옵션 5" },
];

const meta: Meta<typeof AppSelect> = {
  title: "shared/ui/atoms/AppSelect",
  component: AppSelect,
  tags: ["autodocs"],
  argTypes: {
    options: { control: "object", description: "선택 옵션 목록" },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "셀렉트 크기",
    },
    placeholder: { control: "text", description: "플레이스홀더 텍스트" },
    disabled: { control: "boolean", description: "비활성화 여부" },
    state: {
      control: "select",
      options: ["default", "error"],
      description: "상태 (default, error). error는 hint가 있어야 표시된다",
    },
    multiple: { control: "boolean", description: "다중 선택 여부" },
    width: { control: "text", description: '셀렉트 너비 (예: "200px")' },
    fullWidth: { control: "boolean", description: "전체 너비" },
    hint: {
      control: "text",
      description: "하단 에러 문구 (error 상태일 때만 표시)",
    },
    ariaLabel: { control: "text", description: "화면 라벨이 없을 때 스크린리더용 이름. 트리거가 '이름, 현재 값'으로 읽힌다" },
    ariaLabelledby: { control: "text", description: "이름이 되는 바깥 라벨 요소의 id (ariaLabel보다 우선)" },
    portal: { control: "boolean", description: "목록을 document.body에 띄움 — 모달 안 스크롤 영역에서 잘릴 때" },
  },
  args: {
    options: defaultOptions,
    placeholder: "선택해주세요",
    size: "md",
    disabled: false,
    state: "default",
    multiple: false,
    fullWidth: false,
  },
};

export default meta;
type Story = StoryObj<typeof AppSelect>;

// --- Default ---

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<SelectValue | undefined>();
    return <AppSelect {...args} value={value} onChange={(v) => setValue(v as SelectValue)} />;
  },
  parameters: {
    docs: {
      source: {
        code: `<AppSelect value={selected} onChange={setSelected} options={options} placeholder="선택해주세요" />`,
      },
    },
  },
};

// --- With Value ---

export const WithValue: Story = {
  render: (args) => {
    const [value, setValue] = useState<SelectValue>("option2");
    return <AppSelect {...args} value={value} onChange={(v) => setValue(v as SelectValue)} />;
  },
  parameters: {
    docs: {
      description: { story: "값이 선택된 상태" },
      source: {
        code: `<AppSelect value="option2" onChange={setValue} options={options} />`,
      },
    },
  },
};

// --- Sizes ---

export const Sizes: Story = {
  render: () => {
    const [sm, setSm] = useState<SelectValue | undefined>();
    const [md, setMd] = useState<SelectValue | undefined>();
    const [lg, setLg] = useState<SelectValue | undefined>();
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm text-gray-500">Small (sm)</p>
          <AppSelect options={defaultOptions} value={sm} onChange={(v) => setSm(v as SelectValue)} size="sm" placeholder="Small" />
        </div>
        <div>
          <p className="mb-2 text-sm text-gray-500">Medium (md) - 기본</p>
          <AppSelect options={defaultOptions} value={md} onChange={(v) => setMd(v as SelectValue)} size="md" placeholder="Medium" />
        </div>
        <div>
          <p className="mb-2 text-sm text-gray-500">Large (lg)</p>
          <AppSelect options={defaultOptions} value={lg} onChange={(v) => setLg(v as SelectValue)} size="lg" placeholder="Large" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: "셀렉트 크기 옵션 (sm, md, lg)" },
      source: {
        code: `
<AppSelect size="sm" placeholder="Small" />
<AppSelect size="md" placeholder="Medium" />
<AppSelect size="lg" placeholder="Large" />
        `.trim(),
      },
    },
  },
};

// --- Width ---

export const Width: Story = {
  render: () => {
    const [v1, setV1] = useState<SelectValue | undefined>();
    const [v2, setV2] = useState<SelectValue | undefined>();
    const [v3, setV3] = useState<SelectValue | undefined>();
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm text-gray-500">width="180px"</p>
          <AppSelect options={defaultOptions} value={v1} onChange={(v) => setV1(v as SelectValue)} width="180px" placeholder="180px" />
        </div>
        <div>
          <p className="mb-2 text-sm text-gray-500">width="300px"</p>
          <AppSelect options={defaultOptions} value={v2} onChange={(v) => setV2(v as SelectValue)} width="300px" placeholder="300px" />
        </div>
        <div>
          <p className="mb-2 text-sm text-gray-500">width="100%" (기본)</p>
          <AppSelect options={defaultOptions} value={v3} onChange={(v) => setV3(v as SelectValue)} placeholder="100%" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: "width prop으로 셀렉트 너비 지정" },
      source: {
        code: `
<AppSelect width="180px" placeholder="180px" />
<AppSelect width="300px" placeholder="300px" />
<AppSelect placeholder="100% (기본)" />
        `.trim(),
      },
    },
  },
};

// --- Disabled ---

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "비활성화됨",
  },
  parameters: {
    docs: {
      description: { story: "비활성화 상태" },
      source: {
        code: `<AppSelect options={options} disabled placeholder="비활성화됨" />`,
      },
    },
  },
};

// --- With Hint ---

export const WithHint: Story = {
  render: (args) => {
    const [value, setValue] = useState<SelectValue | undefined>();
    return (
      <AppSelect
        {...args}
        value={value}
        onChange={(v) => setValue(v as SelectValue)}
        state="error"
        hint="지표를 선택해주세요."
        placeholder="선택해주세요"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "state가 error이고 hint가 있으면 테두리가 에러색이 되고 하단에 문구가 나옵니다.",
      },
      source: {
        code: `<AppSelect options={options} state="error" hint="지표를 선택해주세요." />`,
      },
    },
  },
};

// --- Multiple ---

export const Multiple: Story = {
  render: (args) => {
    const [value, setValue] = useState<SelectValue[]>([]);
    return (
      <div>
        <AppSelect
          {...args}
          value={value}
          onChange={(v) => setValue(v as SelectValue[])}
          multiple
          placeholder="여러 개 선택"
        />
        <p className="mt-2 text-xs text-gray-500">
          선택된 값: {value.length > 0 ? value.join(", ") : "없음"}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: "다중 선택 모드" },
      source: {
        code: `<AppSelect value={selected} onChange={setSelected} options={options} multiple placeholder="여러 개 선택" />`,
      },
    },
  },
};

// --- With Disabled Options ---

export const WithDisabledOptions: Story = {
  render: () => {
    const [value, setValue] = useState<SelectValue | undefined>();
    const options: SelectOption[] = [
      { value: "option1", label: "옵션 1" },
      { value: "option2", label: "옵션 2 (비활성화)", disabled: true },
      { value: "option3", label: "옵션 3" },
      { value: "option4", label: "옵션 4 (비활성화)", disabled: true },
      { value: "option5", label: "옵션 5" },
    ];
    return (
      <AppSelect
        options={options}
        value={value}
        onChange={(v) => setValue(v as SelectValue)}
        placeholder="선택해주세요"
      />
    );
  },
  parameters: {
    docs: {
      description: { story: "일부 옵션이 비활성화된 경우" },
      source: {
        code: `
const options = [
  { value: "option1", label: "옵션 1" },
  { value: "option2", label: "옵션 2 (비활성화)", disabled: true },
  { value: "option3", label: "옵션 3" },
];

<AppSelect value={selected} onChange={setSelected} options={options} />
        `.trim(),
      },
    },
  },
};

// --- All States ---

export const AllStates: Story = {
  render: () => {
    const [defaultVal, setDefaultVal] = useState<SelectValue | undefined>();
    const [selectedVal, setSelectedVal] = useState<SelectValue>("option1");
    const [disabledVal] = useState<SelectValue | undefined>();
    const [errorVal, setErrorVal] = useState<SelectValue | undefined>();
    return (
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-800">Default</p>
          <AppSelect options={defaultOptions} value={defaultVal} onChange={(v) => setDefaultVal(v as SelectValue)} placeholder="선택해주세요" />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-800">With Value</p>
          <AppSelect options={defaultOptions} value={selectedVal} onChange={(v) => setSelectedVal(v as SelectValue)} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-800">Disabled</p>
          <AppSelect options={defaultOptions} value={disabledVal} disabled placeholder="비활성화" />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-800">Error</p>
          <AppSelect options={defaultOptions} value={errorVal} onChange={(v) => setErrorVal(v as SelectValue)} state="error" hint="필수 항목입니다." placeholder="에러 상태" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: "모든 상태 비교" },
    },
  },
};

// --- Controlled ---

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState<SelectValue>("");
    return (
      <div className="flex flex-col gap-3">
        <AppSelect
          {...args}
          value={value}
          onChange={(v) => setValue(v as SelectValue)}
        />
        <p className="text-sm text-gray-500">
          선택된 값: {value || "(없음)"}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: "인터랙티브 제어 컴포넌트 예시" },
    },
  },
};

// --- All Sizes ---

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-start gap-4">
      {(["sm", "md", "lg"] as const).map((s) => (
        <div key={s} className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">{s}</span>
          <AppSelect options={defaultOptions} size={s} width="200px" />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: { story: "모든 크기 비교" },
    },
  },
};

// --- Page Size Selector (Real World) ---

export const PageSizeSelector: Story = {
  render: () => {
    const [pageSize, setPageSize] = useState<SelectValue>(30);
    const options: SelectOption[] = [
      { value: 10, label: "10개씩 보기" },
      { value: 30, label: "30개씩 보기" },
      { value: 50, label: "50개씩 보기" },
      { value: 100, label: "100개씩 보기" },
    ];
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">총 189개</span>
        <AppSelect
          options={options}
          value={pageSize}
          onChange={(v) => setPageSize(v as SelectValue)}
          width="180px"
          size="sm"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: "실제 사용 예시 - 테이블 페이지 사이즈 선택" },
      source: {
        code: `
<div className="table-header">
  <span>총 189개</span>
  <AppSelect options={pageSizeOptions} value={pageSize} onChange={setPageSize} width="180px" size="sm" />
</div>
        `.trim(),
      },
    },
  },
};

// --- 접근성 이름 ---

export const AccessibleName: Story = {
  render: () => <AccessibleNameDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "라벨 없는 필터는 ariaLabel, 바깥 라벨이 있으면 라벨 id를 ariaLabelledby로 연결한다. DS 트리거는 버튼이라 `<label htmlFor>`만으로는 이름이 붙지 않는다.",
      },
      source: {
        code: `<AppSelect ariaLabel="플랫폼" placeholder="플랫폼" options={options} value={v} onChange={setV} />

<label id="company-label" htmlFor="company">기업</label>
<AppSelect id="company" ariaLabelledby="company-label" options={options} value={v} onChange={setV} />`,
      },
    },
  },
};

function AccessibleNameDemo() {
  const [filter, setFilter] = useState<SelectValue | undefined>();
  const [company, setCompany] = useState<SelectValue | undefined>();
  return (
    <div className="flex flex-col gap-4 w-72">
      <AppSelect ariaLabel="플랫폼" placeholder="플랫폼" options={defaultOptions} value={filter} onChange={(v) => setFilter(v as SelectValue)} />
      <div className="flex flex-col gap-1">
        <label id="story-company-label" htmlFor="story-company" className="text-sm font-medium text-text">
          기업
        </label>
        <AppSelect
          id="story-company"
          ariaLabelledby="story-company-label"
          options={defaultOptions}
          value={company}
          onChange={(v) => setCompany(v as SelectValue)}
        />
      </div>
    </div>
  );
}
