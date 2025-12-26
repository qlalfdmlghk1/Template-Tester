export type Category = 'algorithm' | 'english' | 'cs' | 'interview';

export interface Template {
  id: string;
  category: Category;
  title: string;
  description: string;
  answer: string; // 정답 코드
}

export interface GradingResult {
  totalLines: number;
  correctLines: number;
  accuracy: number; // 백분율 (0-100)
  lineDiffs: LineDiff[];
}

export interface LineDiff {
  lineNumber: number;
  isCorrect: boolean;
  expected: string;
  actual: string;
  charDiffs?: CharDiff[]; // 문자 단위 diff (틀린 경우에만)
}

export interface CharDiff {
  index: number;
  expected: string;
  actual: string;
}
