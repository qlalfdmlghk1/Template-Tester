export type Category = 'algorithm' | 'english' | 'cs' | 'interview';
export type TemplateType = 'paragraph' | 'problem';

export interface Template {
  id: string;
  category: Category;
  title: string;
  description: string;
  answer: string;
  type?: TemplateType;
  userId?: string;
  createdAt?: Date;
}
