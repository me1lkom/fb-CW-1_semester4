# Магазин автомобилей

Интернет-магазин автомобилей с полной авторизацией, ролями и панелью администратора.  

---

## Стек

**Backend**
- Express
- JWT (access + refresh)
- bcrypt
- Swagger
- nanoid

**Frontend**
- React
- React Router
- Axios
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
- Редактирование пользователей
- Удаление

---

## Роли (RBAC)

    Роль       Доступ

    Гость      Вход регистрация
    User       Всё что гость + /me
    Seller     Всё что user + CRUD товаров
    Admin      Полный доступ + управление пользователями

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

