import React, { useState, useEffect } from "react";
import { api } from '../../api';

export default function ProductItem({ product, onEdit, onDelete }) {
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

  if (loading) return null;

  return (
    <div className="productRow">
      {product.imageUrl && (
        <div className="productPhoto">
          <img src={product.imageUrl} alt={product.name} />
        </div>
      )}
      <div className="productMain">
        <div className="productId">#{product.id}</div>
        <div className="productName">{product.name}</div>
        <div className="productCategory">{product.category}</div>
        <div className="productPrice">{product.price} ₽</div>
        <div className="productStock">В наличии: {product.stock}</div>
      </div>
      <div className="productDescription">{product.description}</div>
      <div className="productActions">
        {user && (user.role === 'seller' || user.role === 'admin') && (
          <>
            <button className="btn" onClick={() => onEdit(product)}>
              Редактировать
            </button>
            <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
              Удалить
            </button>
          </>
        )}
      </div>
    </div>
  );
}