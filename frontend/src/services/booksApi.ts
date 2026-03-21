import type { PagedBooksResponse } from '../types/book';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:5105/api';

export async function fetchBooks(
  page: number,
  pageSize: number,
  dir: 'asc' | 'desc',
): Promise<PagedBooksResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sort: 'title',
    dir,
  });

  const response = await fetch(`${apiBaseUrl}/books?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to load books.');
  }

  return (await response.json()) as PagedBooksResponse;
}
