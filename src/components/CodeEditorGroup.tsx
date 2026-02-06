import { useState } from "react";
import { Columns2, Rows2 } from "lucide-react";
import CodeEditor from "./CodeEditor";
import ToggleTabBar from "./ui/ToggleTabBar";

type LayoutType = "row" | "col";

interface CodeEditorGroupProps {
  isEditMode: boolean;
  language: string;

  myCode: string;
  solution: string;

  onChangeMyCode?: (value: string) => void;
  onChangeSolution?: (value: string) => void;

  defaultLayout?: LayoutType;
}

export default function CodeEditorGroup({
  isEditMode,
  language,
  myCode,
  solution,
  onChangeMyCode,
  onChangeSolution,
  defaultLayout = "row",
}: CodeEditorGroupProps) {
  const [layout, setLayout] = useState<LayoutType>(defaultLayout);

  return (
    <div className="space-y-3">
      {/* 레이아웃 변경 버튼 */}
      <div className="flex justify-end">
        <ToggleTabBar
          size="sm"
          value={layout}
          onChange={(value) => setLayout(value as LayoutType)}
          tabs={[
            { value: "row", label: "가로", icon: Columns2 },
            { value: "col", label: "세로", icon: Rows2 },
          ]}
        />
      </div>

      {/* 코드 영역 */}
      <div
        className={`flex w-full gap-2 ${
          layout === "row" ? "flex-row" : "flex-col"
        }`}
      >
        {/* 내 풀이 */}
        {(isEditMode || myCode) && (
          <div className={layout === "row" ? "w-1/2" : "w-full"}>
            {isEditMode && (
              <label className="block text-sm font-medium text-text mb-2">
                내 풀이
              </label>
            )}

            <CodeEditor
              value={myCode}
              language={language}
              onChange={
                isEditMode ? (value) => onChangeMyCode?.(value) : () => {}
              }
              readOnly={!isEditMode}
              collapsible={!isEditMode}
              title={!isEditMode ? "내 풀이" : undefined}
            />
          </div>
        )}

        {/* 참조한 풀이 */}
        {(isEditMode || solution) && (
          <div className={layout === "row" ? "w-1/2" : "w-full"}>
            {isEditMode && (
              <label className="block text-sm font-medium text-text mb-2">
                참조한 풀이
              </label>
            )}

            <CodeEditor
              value={solution}
              language={language}
              onChange={
                isEditMode ? (value) => onChangeSolution?.(value) : () => {}
              }
              readOnly={!isEditMode}
              collapsible={!isEditMode}
              title={!isEditMode ? "참조한 풀이" : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
