import React, { useState, useEffect } from "react";
import { api } from '../../api';

export default function UserItem({ user, onEdit, onDelete }) {
  const [currentUser, setCurrentUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then((userData) => {
        setCurrentUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="productRow">
      <div className="productMain">
        <div className="productId">#{user.id}</div>
        <div className="productName">{user.email}</div>
        <div className="productCategory">{user.first_name}</div>
        <div className="productPrice">{user.last_name} ₽</div>
        <div className="productStock">{user.role}</div>
      </div>
      <div className="productActions">
        
            <button className="btn" onClick={() => onEdit(user)}>
              Редактировать
            </button>
            <button className="btn btn--danger" onClick={() => onDelete(user.id)}>
              Удалить
            </button>
        
      </div>
    </div>
  );
}