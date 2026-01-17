import { useState } from "react";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import SelectBox from "../components/ui/SelectBox";
import ToggleButtonGroup from "../components/ui/ToggleButtonGroup";
import CodeEditor from "../components/CodeEditor";

// 플랫폼별 등급 옵션
const platformOptions = [
  { value: "programmers", label: "프로그래머스" },
  { value: "baekjoon", label: "백준" },
];

const programmersGrades = [
  { value: "lv1", label: "Lv.1" },
  { value: "lv2", label: "Lv.2" },
  { value: "lv3", label: "Lv.3" },
  { value: "lv4", label: "Lv.4" },
  { value: "lv5", label: "Lv.5" },
];

const baekjoonTiers = ["루비", "다이아몬드", "플래티넘", "골드", "실버", "브론즈"];
const baekjoonGrades = baekjoonTiers.flatMap((tier) =>
  [1, 2, 3, 4, 5].map((level) => ({
    value: `${tier.toLowerCase()}${level}`,
    label: `${tier} ${level}`,
  })),
);

// 오답 노트 작성 이유 태그
const tagOptions = [
  { value: "better_solution", label: "더 좋은 풀이 있음" },
  { value: "algorithm_fail", label: "알고리즘 파악 실패" },
  { value: "misunderstand", label: "문제 잘못 이해" },
  { value: "implementation_fail", label: "구현 실패" },
];

// 제출 결과 옵션
const resultOptions = [
  { value: "correct", label: "정답" },
  { value: "timeout", label: "시간 초과" },
  { value: "wrong", label: "틀림" },
];

interface FormData {
  link: string;
  date: string;
  platform: string;
  grade: string;
  myCode: string;
  solution: string;
  comment: string;
  share: boolean;
  tags: string[];
  result: string;
}

export default function WrongNotes() {
  const [formData, setFormData] = useState<FormData>({
    link: "",
    date: new Date().toISOString().split("T")[0],
    platform: "",
    grade: "",
    myCode: "",
    solution: "",
    comment: "",
    share: false,
    tags: [],
    result: "",
  });

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlatformChange = (value: string) => {
    setFormData((prev) => ({ ...prev, platform: value, grade: "" }));
  };

  const getGradeOptions = () => {
    if (formData.platform === "programmers") return programmersGrades;
    if (formData.platform === "baekjoon") return baekjoonGrades;
    return [];
  };

  const handleSubmit = () => {
    console.log("Submit:", formData);
    // TODO: Firebase에 저장
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader title="오답노트" />

        <div className="mt-6 space-y-6">
          {/* 문제 사이트 링크 */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">문제 링크</label>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">날짜</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                  hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">플랫폼</label>
              <SelectBox
                options={platformOptions}
                value={formData.platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                placeholder="플랫폼 선택"
                fullWidth
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">등급</label>
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
              <label className="block text-sm font-medium text-text mb-2">제출 결과</label>
              <ToggleButtonGroup
                options={resultOptions}
                value={formData.result}
                onChange={(value) => handleInputChange("result", value)}
              />
            </div>
            <div className="w-[50%]">
              <label className="block text-sm font-medium text-text mb-2">작성 이유 (복수 선택 가능)</label>
              <ToggleButtonGroup
                options={tagOptions}
                value={formData.tags}
                onChange={(value) => handleInputChange("tags", value)}
                multiple
              />
            </div>
          </div>

          {/* 내 풀이 */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">내 풀이</label>
            <CodeEditor value={formData.myCode} onChange={(value) => handleInputChange("myCode", value)} />
          </div>

          {/* 참조한 풀이 */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">참조한 풀이</label>
            <CodeEditor value={formData.solution} onChange={(value) => handleInputChange("solution", value)} />
          </div>

          {/* 코멘트 */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">코멘트</label>
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
            <Button variant="primary" size="lg" onClick={handleSubmit}>
              오답노트 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
