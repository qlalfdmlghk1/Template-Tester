import Editor from '@monaco-editor/react';
import { theme } from '../styles/theme';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function CodeEditor({ value, onChange, language = 'javascript' }: CodeEditorProps) {
  return (
    <div style={styles.container}>
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

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
  },
};
