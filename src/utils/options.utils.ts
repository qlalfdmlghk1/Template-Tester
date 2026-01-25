import {
  baekjoonTiers,
  categoryOptions,
  languageOptions,
  platformOptions,
  programmersGrades,
  resultOptions,
  tagOptions,
} from "../constants/options.constants";

export const baekjoonGrades = baekjoonTiers.flatMap((tier) =>
  [1, 2, 3, 4, 5].map((level) => ({
    value: `${tier.toLowerCase()}${level}`,
    label: `${tier} ${level}`,
  })),
);

// 플랫폼 라벨 변환
export const getPlatformLabel = (value: string) => {
  return platformOptions.find((p) => p.value === value)?.label || value;
};

// 언어 라벨 변환
export const getLanguageLabel = (value: string) => {
  return languageOptions.find((p) => p.value === value)?.label || value;
};

// 카테고리 라벨 변환
export const getCategoryLabel = (value: string) => {
  return categoryOptions.find((p) => p.value === value)?.label || value;
};

// 등급 라벨 변환
export const getGradeLabel = (platform: string, grade: string) => {
  if (platform === "programmers") {
    return programmersGrades.find((g) => g.value === grade)?.label || grade;
  }
  if (platform === "baekjoon") {
    return baekjoonGrades.find((g) => g.value === grade)?.label || grade;
  }
  return grade;
};

// 제출 결과 라벨 변환
export const getResultLabel = (value: string) => {
  return resultOptions.find((r) => r.value === value)?.label || value;
};

// 태그 라벨 변환
export const getTagLabels = (tags: string[]) => {
  return tags.map((t) => tagOptions.find((opt) => opt.value === t)?.label || t);
};
