import { useEffect, useMemo, useState } from 'react';
import { fetchBooks } from '../services/booksApi';
import type { PagedBooksResponse } from '../types/book';

const pageSizeOptions = [5, 10, 15, 20];

function createPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  [currentPage - 1, currentPage + 1].forEach((value) => {
    if (value > 1 && value < totalPages) {
      pages.add(value);
    }
  });

  return Array.from(pages).sort((a, b) => a - b);
}

export default function BookList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [data, setData] = useState<PagedBooksResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadBooks() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchBooks(page, pageSize, sortDir);
        if (!isCancelled) {
          setData(result);
        }
      } catch {
        if (!isCancelled) {
          setError('Unable to load books right now. Please try again.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      isCancelled = true;
    };
  }, [page, pageSize, sortDir]);

  const pages = useMemo(() => {
    if (!data || data.totalPages === 0) {
      return [];
    }
    return createPageNumbers(data.page, data.totalPages);
  }, [data]);

  const isPreviousDisabled = !data || data.page <= 1;
  const isNextDisabled = !data || data.page >= data.totalPages;

  return (
    <section className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Online Bookstore</h1>
          <p className="text-muted mb-0">Browse books with pagination and title sorting.</p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <label className="form-label mb-0" htmlFor="pageSize">
            Results per page
          </label>
          <select
            id="pageSize"
            className="form-select"
            style={{ width: 'auto' }}
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="btn btn-outline-primary"
            onClick={() => {
              setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
              setPage(1);
            }}
            type="button"
          >
            Sort by title: {sortDir === 'asc' ? 'A to Z' : 'Z to A'}
          </button>
        </div>
      </div>

      {loading && <div className="alert alert-info">Loading books...</div>}

      {error && !loading && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Author</th>
                  <th scope="col">Publisher</th>
                  <th scope="col">ISBN</th>
                  <th scope="col">Classification</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="text-end">
                    Pages
                  </th>
                  <th scope="col" className="text-end">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((book) => (
                  <tr key={book.bookId}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.publisher}</td>
                    <td>{book.isbn}</td>
                    <td>{book.classification}</td>
                    <td>{book.category}</td>
                    <td className="text-end">{book.pageCount}</td>
                    <td className="text-end">${book.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-3">
            <p className="mb-0 text-muted">
              Showing page {data.page} of {Math.max(data.totalPages, 1)} ({data.totalCount} total
              books)
            </p>

            <nav aria-label="Books pagination">
              <ul className="pagination mb-0">
                <li className={`page-item ${isPreviousDisabled ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    type="button"
                    disabled={isPreviousDisabled}
                  >
                    Previous
                  </button>
                </li>

                {pages.map((pageNumber) => (
                  <li
                    key={pageNumber}
                    className={`page-item ${data.page === pageNumber ? 'active' : ''}`}
                  >
                    <button type="button" className="page-link" onClick={() => setPage(pageNumber)}>
                      {pageNumber}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${isNextDisabled ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() =>
                      setPage((current) =>
                        data.totalPages > 0 ? Math.min(data.totalPages, current + 1) : current,
                      )
                    }
                    type="button"
                    disabled={isNextDisabled}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </section>
  );
}
