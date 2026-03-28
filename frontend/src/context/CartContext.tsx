import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Book } from '../types/book';

const CART_STORAGE_KEY = 'bookstore-cart-items';

export interface CartItem {
  bookId: number;
  title: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addBook: (book: Book) => void;
  updateQuantity: (bookId: number, quantity: number) => void;
  removeBook: (bookId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readStoredCartItems(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawValue = sessionStorage.getItem(CART_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as CartItem[];
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item) =>
        typeof item.bookId === 'number' &&
        typeof item.title === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCartItems());

  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    function addBook(book: Book) {
      setItems((currentItems) => {
        const existingItem = currentItems.find((item) => item.bookId === book.bookId);
        if (existingItem) {
          return currentItems.map((item) =>
            item.bookId === book.bookId ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }

        return [
          ...currentItems,
          {
            bookId: book.bookId,
            title: book.title,
            price: book.price,
            quantity: 1,
          },
        ];
      });
    }

    function updateQuantity(bookId: number, quantity: number) {
      const nextQuantity = Math.max(0, Math.floor(quantity));

      setItems((currentItems) => {
        if (nextQuantity === 0) {
          return currentItems.filter((item) => item.bookId !== bookId);
        }

        return currentItems.map((item) =>
          item.bookId === bookId ? { ...item, quantity: nextQuantity } : item,
        );
      });
    }

    function removeBook(bookId: number) {
      setItems((currentItems) => currentItems.filter((item) => item.bookId !== bookId));
    }

    function clearCart() {
      setItems([]);
    }

    return {
      items,
      itemCount,
      total,
      addBook,
      updateQuantity,
      removeBook,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider.');
  }

  return context;
}
