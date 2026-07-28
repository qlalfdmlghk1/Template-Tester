export interface SolutionItem {
  label: string;
  code: string;
}

export interface WrongNote {
  id?: string;
  userId: string;
  userEmail: string | null;
  title: string;
  link: string;
  language: string;
  category: string;
  date: string;
  platform: string;
  grade: string;
  myCode: string;
  myCodeLabel?: string;
  /** @deprecated 기존 데이터 호환용. 새 데이터는 solutions 사용 */
  solution?: string;
  solutions: SolutionItem[];
  comment: string;
  share: boolean;
  tags: string[];
  result: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FormData {
  title: string;
  link: string;
  language: string;
  date: string;
  platform: string;
  category: string;
  grade: string;
  myCode: string;
  myCodeLabel: string;
  solutions: SolutionItem[];
  comment: string;
  share: boolean;
  tags: string[];
  result: string;
}

export interface Filters {
  platform: string;
  category: string;
  result: string;
  language: string;
  tag: string;
}
