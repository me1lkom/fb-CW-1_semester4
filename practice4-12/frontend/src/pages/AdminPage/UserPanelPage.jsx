import React, { useState, useEffect } from "react";
import UserList from "../../components/Admin/UserList";
import UserModal from "../../components/Admin/UserModal";
import { api } from "../../api";
import Header from "../../components/Static/Header";
import Footer from "../../components/Static/Footer";

export default function UserPanelPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user) => {
    setModalMode("edit");
    setEditingUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Удалить пользователя?");
    if (!ok) return;

    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления пользователя");
    }
  };

  const handleSubmitModal = async (user) => {
    try {
      
        const updatedUser = await api.updateUser(user.id, user);
        setUsers((prev) =>
          prev.map((p) => (p.id === user.id ? updatedUser : p))
        );
      
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения пользователя");
    }
  };

  return (
    <div className="page">
      
      <Header />
      
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Пользователи</h1>
          </div>
          
          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <UserList
              users={users}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
      
      <Footer />

      <UserModal
        open={modalOpen}
        mode={modalMode}
        initialUser={editingUser}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}