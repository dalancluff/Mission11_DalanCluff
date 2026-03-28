import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fetchBooks, fetchCategories } from '../services/booksApi';
import type { Book, PagedBooksResponse } from '../types/book';

const pageSizeOptions = [5, 10, 15, 20];
const LAST_LIST_LOCATION_KEY = 'bookstore-last-list-location';
const RETURN_SCROLL_KEY = 'bookstore-return-scroll-y';

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function normalizePageSize(value: number): number {
  return pageSizeOptions.includes(value) ? value : 5;
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addBook, itemCount, total } = useCart();

  const [page, setPage] = useState(() => parsePositiveInt(searchParams.get('page'), 1));
  const [pageSize, setPageSize] = useState(() =>
    normalizePageSize(parsePositiveInt(searchParams.get('pageSize'), 5)),
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() =>
    searchParams.get('dir') === 'desc' ? 'desc' : 'asc',
  );
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? '');
  const [categories, setCategories] = useState<string[]>([]);
  const [data, setData] = useState<PagedBooksResponse | null>(null);
  const [quickViewBook, setQuickViewBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listSearch = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      dir: sortDir,
    });

    if (selectedCategory) {
      params.set('category', selectedCategory);
    }

    return `?${params.toString()}`;
  }, [page, pageSize, sortDir, selectedCategory]);

  useEffect(() => {
    setSearchParams(listSearch, { replace: true });
  }, [listSearch, setSearchParams]);

  useEffect(() => {
    const normalizedPageSize = normalizePageSize(pageSize);
    if (normalizedPageSize !== pageSize) {
      setPageSize(normalizedPageSize);
    }
  }, [pageSize]);

  useEffect(() => {
    const storedScroll = sessionStorage.getItem(RETURN_SCROLL_KEY);
    if (storedScroll) {
      window.scrollTo({ top: Number(storedScroll) || 0, behavior: 'auto' });
      sessionStorage.removeItem(RETURN_SCROLL_KEY);
    }
  }, [location.key]);

  useEffect(() => {
    if (!quickViewBook) {
      return;
    }

    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [quickViewBook]);

  useEffect(() => {
    let isCancelled = false;

    async function loadCategories() {
      try {
        const result = await fetchCategories();
        if (!isCancelled) {
          setCategories(result);
        }
      } catch {
        // Keep the books table usable even if category options cannot be loaded.
        if (!isCancelled) {
          setCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadBooks() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchBooks(
          page,
          normalizePageSize(pageSize),
          sortDir,
          selectedCategory || undefined,
        );
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
  }, [page, pageSize, sortDir, selectedCategory]);

  const pages = useMemo(() => {
    if (!data || data.totalPages === 0) {
      return [];
    }
    return createPageNumbers(data.page, data.totalPages);
  }, [data]);

  const isPreviousDisabled = !data || data.page <= 1;
  const isNextDisabled = !data || data.page >= data.totalPages;

  function rememberListLocation() {
    const returnLocation = {
      pathname: '/',
      search: listSearch,
      scrollY: window.scrollY,
    };

    sessionStorage.setItem(LAST_LIST_LOCATION_KEY, JSON.stringify(returnLocation));
    return returnLocation;
  }

  return (
    <section className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Online Bookstore</h1>
          <p className="text-muted mb-0">Browse books with pagination and title sorting.</p>
        </div>

        <div className="card border-0 shadow-sm" style={{ minWidth: 260 }}>
          <div className="card-body py-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">Cart Summary</span>
              <span className="badge text-bg-primary rounded-pill">{itemCount} items</span>
            </div>
            <p className="mb-2">Total: ${total.toFixed(2)}</p>
            <button
              className="btn btn-sm btn-primary w-100"
              type="button"
              onClick={() => {
                const returnTo = rememberListLocation();
                navigate('/cart', { state: { returnTo } });
              }}
            >
              View Cart
            </button>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <label className="form-label mb-0" htmlFor="categoryFilter">
            Category
          </label>
          <select
            id="categoryFilter"
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedCategory}
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

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
                  <th scope="col" className="text-end">
                    Cart
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
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        type="button"
                        onClick={() => setQuickViewBook(book)}
                      >
                        Details
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success"
                        type="button"
                        onClick={() => {
                          addBook(book);
                          rememberListLocation();
                        }}
                      >
                        Add to Cart
                      </button>
                    </td>
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

      {quickViewBook && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title fs-5">{quickViewBook.title}</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setQuickViewBook(null)}
                  />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Author:</strong> {quickViewBook.author}
                      </p>
                      <p className="mb-2">
                        <strong>Publisher:</strong> {quickViewBook.publisher}
                      </p>
                      <p className="mb-2">
                        <strong>ISBN:</strong> {quickViewBook.isbn}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Classification:</strong> {quickViewBook.classification}
                      </p>
                      <p className="mb-2">
                        <strong>Category:</strong> {quickViewBook.category}
                      </p>
                      <p className="mb-2">
                        <strong>Pages:</strong> {quickViewBook.pageCount}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-between">
                  <span className="fw-semibold">Price: ${quickViewBook.price.toFixed(2)}</span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setQuickViewBook(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        addBook(quickViewBook);
                        rememberListLocation();
                        setQuickViewBook(null);
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setQuickViewBook(null)} />
        </>
      )}
    </section>
  );
}
