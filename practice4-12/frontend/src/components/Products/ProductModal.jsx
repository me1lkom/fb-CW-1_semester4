import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      setName(initialProduct.name || "");
      setCategory(initialProduct.category || "");
      setDescription(initialProduct.description || "");
      setPrice(initialProduct.price?.toString() || "");
      setStock(initialProduct.stock?.toString() || "");
      setImageUrl(initialProduct.imageUrl || "");
    } else {
      setName("");
      setCategory("");
      setDescription("");
      setPrice("");
      setStock("");
      setImageUrl("");
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Добавление товара";

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDesc = description.trim();
    const trimmedImageUrl = imageUrl.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    
    if (!trimmedName) {
      alert("Введите название товара");
      return;
    }
    if (!trimmedCategory) {
      alert("Введите категорию");
      return;
    }
    if (!trimmedDesc) {
      alert("Введите описание");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert("Введите корректную цену");
      return;
    }
    if (!trimmedImageUrl) {
    alert("Введите URL изображения");
    return;
  }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      alert("Введите корректное количество");
      return;
    }
    
    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDesc,
      price: parsedPrice,
      stock: parsedStock,
      imageUrl: trimmedImageUrl
    });
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>
        
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Mazda 3 2023"
              autoFocus
            />
          </label>
          
          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Например, Хэтчбек / Премиум"
            />
          </label>
          
          <label className="label">
            Описание
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание товара..."
              rows="3"
            />
          </label>
          
          <label className="label">
            URL изображения
            <input
              className="input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/car.jpg"
            />
          </label>
          
          {imageUrl && (
            <div className="imagePreview">
              <img 
                src={imageUrl} 
                alt="Предпросмотр"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/200x150?text=Ошибка+загрузки';
                }}
              />
            </div>
          )}

          <label className="label">
            Цена (₽)
            <input
              className="input"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Например, 75000"
              min="0"
              step="1"
            />
          </label>
          
          <label className="label">
            Количество на складе
            <input
              className="input"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Например, 15"
              min="0"
              step="1"
            />
          </label>
          
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}