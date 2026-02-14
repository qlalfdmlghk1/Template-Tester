import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import CodeEditor from "./CodeEditor";

const samplePython = `def hello(name: str) -> str:
    """인사 메시지를 반환합니다."""
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(hello("World"))
`;

const sampleJavaScript = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
`;

const sampleJson = `{
  "name": "ad-connect",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
`;

const meta: Meta<typeof CodeEditor> = {
  title: "shared/ui/molecules/CodeEditor",
  component: CodeEditor,
  argTypes: {
    language: {
      control: "select",
      options: ["python", "javascript", "typescript", "json", "html", "css"],
      description: "코드 언어",
    },
    readOnly: { control: "boolean", description: "읽기 전용" },
    height: { control: "text", description: "에디터 높이" },
    collapsible: { control: "boolean", description: "접기/펼치기 가능 여부" },
    defaultCollapsed: { control: "boolean", description: "기본 접힘 상태" },
    title: { control: "text", description: "접기/펼치기 영역 제목" },
  },
  args: {
    value: samplePython,
    language: "python",
    readOnly: false,
    height: "300px",
    collapsible: false,
    defaultCollapsed: false,
  },
};

export default meta;
type Story = StoryObj<typeof CodeEditor>;

// --- 기본 ---

export const Default: Story = {
  args: {
    language: "typescript"
  },

  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  }
};

// --- 언어 ---

export const Python: Story = {
  args: { language: "python", value: samplePython },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};

export const JavaScript: Story = {
  args: { language: "javascript", value: sampleJavaScript },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};

export const Json: Story = {
  args: { language: "json", value: sampleJson },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};

// --- 상태 ---

export const ReadOnly: Story = {
  args: { readOnly: true, value: samplePython },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};

export const CustomHeight: Story = {
  args: { height: "200px", value: samplePython },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};

// --- Collapsible ---

export const Collapsible: Story = {
  args: {
    collapsible: true,
    title: "Python 코드",
    value: samplePython,
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};

export const CollapsedByDefault: Story = {
  args: {
    collapsible: true,
    defaultCollapsed: true,
    title: "접힌 코드",
    value: samplePython,
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};
