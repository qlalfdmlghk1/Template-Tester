import { useWrongNoteWrite } from "@/hooks/wront-notes/useWrongNoteWrite";
import SelectBox from "../ui/SelectBox";
import {
  categoryOptions,
  languageOptions,
  platformOptions,
  resultOptions,
  tagOptions,
} from "@/constants/options.constants";
import ToggleButtonGroup from "../ui/ToggleButtonGroup";
import CodeEditorGroup from "../CodeEditorGroup";
import Button from "../ui/Button";

type WriteSectionProps = {
  cb: () => void;
};

export const WriteSection = ({ cb }: WriteSectionProps) => {
  const {
    formData,
    handleInputChange,
    handlePlatformChange,
    getGradeOptions,
    handleSubmit,
    isSubmitting,
  } = useWrongNoteWrite(cb);
  return (
    <div className="mt-6 space-y-6">
      {/* 문제 이름 & 언어 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            문제 이름
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="예: 두 수의 합, 타겟 넘버 등"
            className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                    hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            언어
          </label>
          <SelectBox
            options={languageOptions}
            value={formData.language}
            onChange={(e) => handleInputChange("language", e.target.value)}
            placeholder="언어 선택"
            fullWidth
          />
        </div>
      </div>

      {/* 문제 링크 */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          문제 링크
        </label>
        <input
          type="url"
          value={formData.link}
          onChange={(e) => handleInputChange("link", e.target.value)}
          placeholder="https://programmers.co.kr/..."
          className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                  hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
        />
      </div>

      {/* 날짜 & 플랫폼 & 등급 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            날짜
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                    hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            알고리즘
          </label>
          <SelectBox
            options={categoryOptions}
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            placeholder="알고리즘 선택"
            fullWidth
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            플랫폼
          </label>
          <SelectBox
            options={platformOptions}
            value={formData.platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            placeholder="플랫폼 선택"
            fullWidth
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            등급
          </label>
          <SelectBox
            options={getGradeOptions()}
            value={formData.grade}
            onChange={(e) => handleInputChange("grade", e.target.value)}
            placeholder={formData.platform ? "등급 선택" : "플랫폼을 먼저 선택"}
            disabled={!formData.platform}
            fullWidth
          />
        </div>
      </div>

      {/* 제출 결과 & 작성 이유 */}
      <div className="flex w-full justify-between items-start">
        <div className="w-[50%]">
          <label className="block text-sm font-medium text-text mb-2">
            제출 결과
          </label>
          <ToggleButtonGroup
            options={resultOptions}
            value={formData.result}
            onChange={(value) => handleInputChange("result", value)}
          />
        </div>
        <div className="w-[50%]">
          <label className="block text-sm font-medium text-text mb-2">
            작성 이유 (복수 선택 가능)
          </label>
          <ToggleButtonGroup
            options={tagOptions}
            value={formData.tags}
            onChange={(value) => handleInputChange("tags", value)}
            multiple
          />
        </div>
      </div>
      <CodeEditorGroup
        isEditMode={true}
        language={formData.language}
        myCode={formData.myCode}
        solution={formData.solution}
        onChangeMyCode={(value) => handleInputChange("myCode", value)}
        onChangeSolution={(value) => handleInputChange("solution", value)}
      />

      {/* 코멘트 */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          코멘트
        </label>
        <textarea
          value={formData.comment}
          onChange={(e) => handleInputChange("comment", e.target.value)}
          placeholder="이 문제에서 배운 점, 주의할 점 등을 기록하세요..."
          rows={4}
          className="w-full px-4 py-3 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                  hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all resize-none"
        />
      </div>

      {/* 공유하기 */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="share"
          checked={formData.share}
          onChange={(e) => handleInputChange("share", e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
        />
        <label htmlFor="share" className="text-sm text-text cursor-pointer">
          다른 사용자에게 공유하기
        </label>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "저장 중..." : "오답노트 저장"}
        </Button>
      </div>
    </div>
  );
};
