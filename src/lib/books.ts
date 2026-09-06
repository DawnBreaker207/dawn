export interface Book {
  title: string;
  author: string;
  status: 'reading' | 'read';
  progress?: string;
}

export const BOOKS: Book[] = [];