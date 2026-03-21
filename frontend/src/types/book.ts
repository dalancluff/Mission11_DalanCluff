export interface Book {
  bookId: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  classification: string;
  category: string;
  pageCount: number;
  price: number;
}

export interface PagedBooksResponse {
  items: Book[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sort: string;
  dir: 'asc' | 'desc';
}
