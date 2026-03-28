import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const LAST_LIST_LOCATION_KEY = 'bookstore-last-list-location';

type ReturnLocation = {
  pathname: string;
  search: string;
  scrollY: number;
};

function readLastListLocation(): ReturnLocation | null {
  const rawValue = sessionStorage.getItem(LAST_LIST_LOCATION_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as ReturnLocation;
    if (typeof parsed.pathname === 'string' && typeof parsed.search === 'string') {
      return {
        pathname: parsed.pathname,
        search: parsed.search,
        scrollY: Number(parsed.scrollY) || 0,
      };
    }
  } catch {
    // Ignore malformed session data and use fallback route.
  }

  return null;
}

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, itemCount, total, updateQuantity, removeBook, clearCart } = useCart();

  const returnLocation = useMemo(() => {
    const stateValue = location.state as { returnTo?: ReturnLocation } | null;
    if (stateValue?.returnTo) {
      return stateValue.returnTo;
    }

    return readLastListLocation();
  }, [location.state]);

  function handleContinueShopping() {
    const destination = returnLocation ?? { pathname: '/', search: '', scrollY: 0 };
    sessionStorage.setItem('bookstore-return-scroll-y', String(destination.scrollY));
    navigate(`${destination.pathname}${destination.search}`);
  }

  return (
    <section className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Shopping Cart</h1>
          <p className="text-muted mb-0">Review books in your cart and adjust quantities.</p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" type="button" onClick={handleContinueShopping}>
            Continue Shopping
          </button>
          <button
            className="btn btn-outline-danger"
            type="button"
            onClick={clearCart}
            disabled={items.length === 0}
          >
            Clear Cart
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info">Your cart is empty. Add a few books to get started.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col" className="text-end">
                    Price
                  </th>
                  <th scope="col" className="text-center">
                    Quantity
                  </th>
                  <th scope="col" className="text-end">
                    Subtotal
                  </th>
                  <th scope="col" className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const subtotal = item.price * item.quantity;
                  return (
                    <tr key={item.bookId}>
                      <td>{item.title}</td>
                      <td className="text-end">${item.price.toFixed(2)}</td>
                      <td className="text-center" style={{ maxWidth: 170 }}>
                        <div className="input-group input-group-sm justify-content-center">
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <input
                            className="form-control text-center"
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              updateQuantity(item.bookId, nextValue);
                            }}
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="text-end">${subtotal.toFixed(2)}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          type="button"
                          onClick={() => removeBook(item.bookId)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <div className="card shadow-sm" style={{ minWidth: 320 }}>
              <div className="card-body">
                <h2 className="h5">Order Summary</h2>
                <p className="mb-2">Items: {itemCount}</p>
                <p className="mb-0 fw-semibold">Total: ${total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
