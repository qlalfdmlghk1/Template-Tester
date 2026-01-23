import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Chip from "../components/ui/Chip";
import SelectBox from "../components/ui/SelectBox";
import ToggleButtonGroup from "../components/ui/ToggleButtonGroup";
import CodeEditor from "../components/CodeEditor";
import {
  saveWrongNote,
  getWrongNotes,
  deleteWrongNote,
  type WrongNote,
} from "../firebase/services";

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

const baekjoonTiers = [
  "루비",
  "다이아몬드",
  "플래티넘",
  "골드",
  "실버",
  "브론즈",
];
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

// 언어 옵션
const languageOptions = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

// 알고리즘 분류 옵션
const categoryOptions = [
  { value: "math", label: "수학" },
  { value: "simulation", label: "구현" },
  { value: "dp", label: "DP" },
  { value: "graph", label: "그래프 탐색" },
  { value: "greedy", label: "그리디" },
  { value: "bfs", label: "BFS" },
  { value: "dfs", label: "DFS" },
  { value: "backtracking", label: "백트래킹" },
  { value: "data_structure", label: "자료구조" },
  { value: "two_pointer", label: "투포인터" },
  { value: "full_search", label: "완전 탐색" },
  { value: "priority_queue", label: "우선순위 큐" },
  { value: "etc", label: "기타" },
];

interface FormData {
  link: string;
  language: string;
  date: string;
  platform: string;
  category: string;
  grade: string;
  myCode: string;
  solution: string;
  comment: string;
  share: boolean;
  tags: string[];
  result: string;
}

// 플랫폼 라벨 변환
const getPlatformLabel = (value: string) => {
  return platformOptions.find((p) => p.value === value)?.label || value;
};

// 플랫폼 라벨 변환
const getCategoryLabel = (value: string) => {
  return categoryOptions.find((p) => p.value === value)?.label || value;
};

// 등급 라벨 변환
const getGradeLabel = (platform: string, grade: string) => {
  if (platform === "programmers") {
    return programmersGrades.find((g) => g.value === grade)?.label || grade;
  }
  if (platform === "baekjoon") {
    return baekjoonGrades.find((g) => g.value === grade)?.label || grade;
  }
  return grade;
};

// 제출 결과 라벨 변환
const getResultLabel = (value: string) => {
  return resultOptions.find((r) => r.value === value)?.label || value;
};

// 태그 라벨 변환
const getTagLabels = (tags: string[]) => {
  return tags.map((t) => tagOptions.find((opt) => opt.value === t)?.label || t);
};

// 필터 타입
interface Filters {
  platform: string;
  category: string;
  result: string;
  tag: string;
}

export default function WrongNotes() {
  const [activeTab, setActiveTab] = useState<"write" | "list">("list");
  const [formData, setFormData] = useState<FormData>({
    link: "",
    language: "",
    date: new Date().toISOString().split("T")[0],
    platform: "",
    category: "",
    grade: "",
    myCode: "",
    solution: "",
    comment: "",
    share: false,
    tags: [],
    result: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState<WrongNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    platform: "",
    category: "",
    result: "",
    tag: "",
  });
  const navigate = useNavigate();

  // 필터링된 노트
  const filteredNotes = notes.filter((note) => {
    if (filters.platform && note.platform !== filters.platform) return false;
    if (filters.category && note.category !== filters.category) return false;
    if (filters.result && note.result !== filters.result) return false;
    if (filters.tag && !note.tags.includes(filters.tag)) return false;
    return true;
  });

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ platform: "", category: "", result: "", tag: "" });
  };

  const hasActiveFilters = filters.platform || filters.result || filters.tag;

  // 목록 불러오기
  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const data = await getWrongNotes();
      setNotes(data);
    } catch (error) {
      console.error("조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") {
      loadNotes();
    }
  }, [activeTab]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[],
  ) => {
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

  const resetForm = () => {
    setFormData({
      link: "",
      language: "",
      date: new Date().toISOString().split("T")[0],
      platform: "",
      grade: "",
      category: "",
      myCode: "",
      solution: "",
      comment: "",
      share: false,
      tags: [],
      result: "",
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await saveWrongNote(formData);
      alert("오답노트가 저장되었습니다.");
      resetForm();
      setActiveTab("list");
    } catch (error) {
      console.error("저장 실패:", error);
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteWrongNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader title="오답노트" />

        {/* 탭 */}
        <div className="flex gap-2 mt-6 border-b border-border">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "list"
                ? "text-primary border-primary"
                : "text-textSecondary border-transparent hover:text-text"
            }`}
          >
            목록
          </button>
          <button
            onClick={() => setActiveTab("write")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "write"
                ? "text-primary border-primary"
                : "text-textSecondary border-transparent hover:text-text"
            }`}
          >
            작성
          </button>
        </div>

        {/* 목록 탭 */}
        {activeTab === "list" && (
          <div className="mt-6">
            {/* 필터 */}
            {notes.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-surface border border-border rounded-lg">
                <span className="text-sm font-medium text-text">필터</span>
                <SelectBox
                  options={categoryOptions}
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  placeholder="알고리즘"
                  selectSize="sm"
                />
                <SelectBox
                  options={platformOptions}
                  value={filters.platform}
                  onChange={(e) =>
                    handleFilterChange("platform", e.target.value)
                  }
                  placeholder="플랫폼"
                  selectSize="sm"
                />
                <SelectBox
                  options={resultOptions}
                  value={filters.result}
                  onChange={(e) => handleFilterChange("result", e.target.value)}
                  placeholder="결과"
                  selectSize="sm"
                />
                <SelectBox
                  options={tagOptions}
                  value={filters.tag}
                  onChange={(e) => handleFilterChange("tag", e.target.value)}
                  placeholder="작성 이유"
                  selectSize="sm"
                />
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-xs text-textSecondary hover:text-error transition-colors"
                  >
                    초기화
                  </button>
                )}
                <span className="ml-auto text-xs text-textSecondary">
                  {filteredNotes.length}개 / 전체 {notes.length}개
                </span>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12 text-textSecondary">
                불러오는 중...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-textSecondary mb-4">
                  아직 작성한 오답노트가 없습니다.
                </p>
                <Button variant="primary" onClick={() => setActiveTab("write")}>
                  첫 오답노트 작성하기
                </Button>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-textSecondary mb-4">
                  필터 조건에 맞는 오답노트가 없습니다.
                </p>
                <Button variant="ghost" onClick={clearFilters}>
                  필터 초기화
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate(`/wrong-notes/${note.id}`)}
                    className="p-4 bg-surface border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Chip variant="success">
                            {getCategoryLabel(note.category)}
                          </Chip>
                          <Chip variant="primary">
                            {getPlatformLabel(note.platform)}
                          </Chip>
                          {note.grade && (
                            <Chip variant="secondary">
                              {getGradeLabel(note.platform, note.grade)}
                            </Chip>
                          )}
                          <Chip
                            variant={
                              note.result === "correct"
                                ? "success"
                                : note.result === "timeout"
                                  ? "warning"
                                  : "error"
                            }
                          >
                            {getResultLabel(note.result)}
                          </Chip>
                        </div>
                        <a
                          href={note.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-text font-medium hover:text-primary transition-colors"
                        >
                          {note.link}
                        </a>
                        <div className="flex items-center gap-2 mt-2 text-xs text-textSecondary">
                          <span>{note.date}</span>
                          {note.tags.length > 0 && (
                            <>
                              <span>·</span>
                              <span>{getTagLabels(note.tags).join(", ")}</span>
                            </>
                          )}
                        </div>
                        {note.comment ? (
                          <p className="mt-2 text-sm text-textSecondary line-clamp-2">
                            {note.comment}
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (note.id) handleDelete(note.id);
                        }}
                        className="p-2 text-textSecondary hover:text-error transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 작성 탭 */}
        {activeTab === "write" && (
          <div className="mt-6 space-y-6">
            {/* 문제 링크 & 언어 */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
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
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  언어
                </label>
                <SelectBox
                  options={languageOptions}
                  value={formData.language}
                  onChange={(e) =>
                    handleInputChange("language", e.target.value)
                  }
                  placeholder="언어 선택"
                  fullWidth
                />
              </div>
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
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
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
                  placeholder={
                    formData.platform ? "등급 선택" : "플랫폼을 먼저 선택"
                  }
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

            {/* 내 풀이 */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                내 풀이
              </label>
              <CodeEditor
                value={formData.myCode}
                onChange={(value) => handleInputChange("myCode", value)}
              />
            </div>

            {/* 참조한 풀이 */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                참조한 풀이
              </label>
              <CodeEditor
                value={formData.solution}
                onChange={(value) => handleInputChange("solution", value)}
              />
            </div>

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
              <label
                htmlFor="share"
                className="text-sm text-text cursor-pointer"
              >
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
        )}
      </div>
    </div>
  );
}
