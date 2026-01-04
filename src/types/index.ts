export type Category = 'algorithm' | 'english' | 'cs' | 'interview';
export type TemplateType = 'paragraph' | 'problem'; // 줄글형 | 문제형

export interface Template {
  id: string;
  category: Category;
  title: string;
  description: string;
  answer: string; // 정답 코드
  type?: TemplateType; // 템플릿 형태 (기존 템플릿은 optional)
  userId?: string; // 유저가 등록한 템플릿인 경우
  createdAt?: Date; // 생성 시간
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
  wordDiffs?: WordDiff[]; // 단어 단위 diff (틀린 경우에만)
}

export interface WordDiff {
  index: number;
  expected: string;
  actual: string;
}
