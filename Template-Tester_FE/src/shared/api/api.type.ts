export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse {
  message: string;
  code: string;
}
