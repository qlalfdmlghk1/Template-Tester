// 플랫폼별 등급 옵션
export const platformOptions = [
  { value: "programmers", label: "프로그래머스" },
  { value: "baekjoon", label: "백준" },
];

export const programmersGrades = [
  { value: "lv1", label: "Lv.1" },
  { value: "lv2", label: "Lv.2" },
  { value: "lv3", label: "Lv.3" },
  { value: "lv4", label: "Lv.4" },
  { value: "lv5", label: "Lv.5" },
];

export const baekjoonTiers = [
  "루비",
  "다이아몬드",
  "플래티넘",
  "골드",
  "실버",
  "브론즈",
];

// 오답 노트 작성 이유 태그
export const tagOptions = [
  { value: "better_solution", label: "더 좋은 풀이 있음" },
  { value: "algorithm_fail", label: "알고리즘 파악 실패" },
  { value: "misunderstand", label: "문제 잘못 이해" },
  { value: "implementation_fail", label: "구현 실패" },
];

// 제출 결과 옵션
export const resultOptions = [
  { value: "correct", label: "정답" },
  { value: "timeout", label: "시간 초과" },
  { value: "wrong", label: "틀림" },
];

// 언어 옵션
export const languageOptions = [
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
export const categoryOptions = [
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
  { value: "divide_conquer", label: "분할 정복" },
  { value: "priority_queue", label: "우선순위 큐" },
  { value: "etc", label: "기타" },
];

// --- 유틸 함수 ---

export const baekjoonGrades = baekjoonTiers.flatMap((tier) =>
  [1, 2, 3, 4, 5].map((level) => ({
    value: `${tier.toLowerCase()}${level}`,
    label: `${tier} ${level}`,
  })),
);

export const getPlatformLabel = (value: string) => {
  return platformOptions.find((p) => p.value === value)?.label || value;
};

export const getLanguageLabel = (value: string) => {
  return languageOptions.find((p) => p.value === value)?.label || value;
};

export const getCategoryLabel = (value: string) => {
  return categoryOptions.find((p) => p.value === value)?.label || value;
};

export const getGradeLabel = (platform: string, grade: string) => {
  if (platform === "programmers") {
    return programmersGrades.find((g) => g.value === grade)?.label || grade;
  }
  if (platform === "baekjoon") {
    return baekjoonGrades.find((g) => g.value === grade)?.label || grade;
  }
  return grade;
};

export const getResultLabel = (value: string) => {
  return resultOptions.find((r) => r.value === value)?.label || value;
};

export const getTagLabels = (tags: string[]) => {
  return tags.map((t) => tagOptions.find((opt) => opt.value === t)?.label || t);
};
