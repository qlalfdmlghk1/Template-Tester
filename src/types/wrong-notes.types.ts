export interface FormData {
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

export interface Filters {
  platform: string;
  category: string;
  result: string;
  language: string;
  tag: string;
}
