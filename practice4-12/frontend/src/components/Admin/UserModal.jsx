import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialUser, onClose, onSubmit }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");


  
  useEffect(() => {
    if (!open) return;
    if (initialUser) {
      setEmail(initialUser.email || "");
      setFirstName(initialUser.first_name || "");
      setLastName(initialUser.last_name || "");
      setRole(initialUser.role || "");
    } else {
      setEmail("");
      setFirstName("");
      setLastName("");
      setRole("");
    }
  }, [open, initialUser]);

  if (!open) return null;

  const title = "Редактирование пользователя";

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedEmail= email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedRole = role.trim();


    if (!trimmedEmail) {
      alert("Введите почту пользователя");
      return;
    }
    if (!trimmedFirstName) {
      alert("Введите имя пользователя");
      return;
    }
    if (!trimmedLastName) {
      alert("Введите фамилию пользователя");
      return;
    }
    if (!trimmedRole) {
      alert("Введите роль пользователя");
      return;
    }

    const validRoles = ['user', 'seller', 'admin'];
    if (!validRoles.includes(trimmedRole)) {
        alert("Роль должна быть одной из: user, seller, admin");
        return;
    }
  
    onSubmit({
      id: initialUser?.id,
      email: trimmedEmail,
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      role: trimmedRole,
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
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Например, primet@email.com"
              autoFocus
            />
          </label>
          
          <label className="label">
            Имя
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Например, Иван"
            />
          </label>
          
          <label className="label">
            Фамилия
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Например, Иванов"
            />
          </label>
          
          <label className="label">
            Роль
            <input
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Одну из: user, seller, admin"
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