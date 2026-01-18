import { useState } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  title?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = "javascript",
  readOnly = false,
  height = "600px",
  collapsible = false,
  defaultCollapsed = false,
  title,
}: CodeEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (collapsible) {
    return (
      <div className="border border-border rounded-md overflow-hidden bg-[#1e1e1e]">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-300 hover:bg-[#2d2d2d] transition-colors"
        >
          <span className="text-sm font-medium">{title || "코드"}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!isCollapsed && (
          <div className="py-3">
            <Editor
              height={height}
              language={language}
              value={value}
              onChange={(newValue) => onChange(newValue || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                readOnly,
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden bg-[#1e1e1e] py-3">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(newValue) => onChange(newValue || "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          readOnly,
        }}
      />
    </div>
  );
}
