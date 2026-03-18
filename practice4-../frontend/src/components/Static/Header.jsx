import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { api } from '../../api';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };


  if (loading) {
    return (
      <header className="header">
        <div className="header__inner">
          <a href="/" className="brand">Мой Магазин</a>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="header__inner">
        <a href="/" className="brand">Мой Магазин</a>
        
        <nav className="header__nav">
          {user && user.role === 'admin' && (
              <Link to="/userpanel" className="btn btn--panel">Палень пользователей</Link>
          )}
          <button onClick={handleLogout} className="btn btn--primary">
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
}