// Daily 학습 (적응형 출제) 도메인 타입 정의
// 기획서 3.6.2 데이터 모델 참고

/** 주제 3단계 묶음 (대주제 > 소주제 > 세부주제) */
export interface Subject {
  id: string; // uuid
  topic: string; // 대주제 (예: "프론트엔드")
  sub: string; // 소주제 (예: "JavaScript")
  detail: string; // 세부주제 (예: "함수")
  createdAt: number; // epoch ms
}

/** 개념별 학습 추적 (핵심) */
export interface Concept {
  id: string; // uuid
  subjectId: string; // FK → Subject.id
  name: string; // 개념명 (예: "클로저")
  correctCount: number;
  wrongCount: number;
  easeFactor: number; // SM-2, 기본 2.5, 최소 1.3
  interval: number; // 다음 복습까지 일수
  repetitions: number; // 연속 정답 횟수
  nextReviewAt: number; // epoch ms (by_nextReview 인덱스 대상)
  lastReviewedAt: number | null;
}

/** 풀이 기록 */
export interface Attempt {
  id: string; // uuid
  conceptId: string; // FK → Concept.id
  question: string;
  choices?: string[]; // 객관식일 때만
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  grade: number; // 0~5 (SM-2 입력값)
  solvedAt: number; // epoch ms (by_solvedAt 인덱스 대상)
}

/** 문제 유형 */
export type QuestionType = "mcq" | "short";

/** Claude(Firebase Function)가 반환하는 문제 형식 */
export interface GeneratedQuestion {
  conceptId: string;
  type: QuestionType;
  question: string;
  choices?: string[]; // type === "mcq"일 때
  answer: string;
  explanation: string;
}

/** SM-2 복습 상태 (기획서 3.6.4) */
export interface ReviewState {
  easeFactor: number;
  interval: number;
  repetitions: number;
}
