# Магазин автомобилей — Fullstack Pet-проект

Интернет-магазин автомобилей с полной авторизацией, ролями и админ-панелью.  
Стек: React + Express + JWT + RBAC + Swagger.

---

## Стек

**Backend**
- Express
- JWT (access + refresh)
- bcrypt
- Swagger (OpenAPI)
- nanoid

**Frontend**
- React 18
- React Router v6
- Axios (interceptors)
- SCSS

---

## Функциональность

### Аутентификация
- Регистрация / Вход
- Access + Refresh токены
- Автообновление токена при 401
- Защита маршрутов

### Товары
- Просмотр списка и деталей
- Создание / Редактирование (seller / admin)
- Удаление (admin)

### Пользователи (только admin)
- Список всех пользователей
- Редактирование роли
- Удаление

---

## Роли (RBAC)

| Роль       | Доступ |
|------------|--------|
| Гость      | Вход регистрация |
| User       | Всё что гость + /me |
| Seller     | Всё что user + CRUD товаров |
| Admin      | Полный доступ + управление пользователями |

---

## Запуск

```bash
# backend
cd backend
npm install
node app.js
# → http://localhost:3000

# frontend
cd frontend
npm install
npm start
# → http://localhost:3001