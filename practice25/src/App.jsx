import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/about" style={{ marginLeft: '10px' }}>О нас</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Suspense fallback={<div>Загрузка...</div>}>
          <Route path="/about" element={<About />} />
        </Suspense>
      </Routes>
    </BrowserRouter>
  );
}

