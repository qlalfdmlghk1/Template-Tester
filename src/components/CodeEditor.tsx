import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function CodeEditor({ value, onChange, language = 'javascript' }: CodeEditorProps) {
  return (
    <div className="border border-border rounded-md overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="600px"
        language={language}
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}
