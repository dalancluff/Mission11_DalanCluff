import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import BookList from './components/BookList';
import CartPage from './components/CartPage';

function getPreferredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getPreferredTheme());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function handleThemeChange(event: MediaQueryListEvent) {
      setTheme(event.matches ? 'dark' : 'light');
    }

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  return (
    <main className="min-vh-100 bg-body-tertiary text-body">
      <header className="border-bottom bg-body sticky-top">
        <div className="container py-2 d-flex justify-content-between align-items-center">
          <Link className="text-decoration-none fw-semibold text-body" to="/">
            Online Bookstore
          </Link>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<BookList />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </main>
  );
}

export default App;
