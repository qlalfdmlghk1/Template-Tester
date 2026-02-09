export interface Submission {
  id?: string;
  userId: string;
  userEmail: string | null;
  templateId: string;
  templateTitle: string;
  category: string;
  userCode: string;
  score: number;
  totalLines: number;
  correctLines: number;
  createdAt: Date;
}

export interface GradingResult {
  totalLines: number;
  correctLines: number;
  accuracy: number;
  lineDiffs: LineDiff[];
}

export interface LineDiff {
  lineNumber: number;
  isCorrect: boolean;
  expected: string;
  actual: string;
  wordDiffs?: WordDiff[];
}

export interface WordDiff {
  index: number;
  expected: string;
  actual: string;
}
