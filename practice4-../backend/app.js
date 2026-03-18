const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const bcrypt = require("bcrypt");

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'access_secret';
const ACCESS_EXPIRES_IN = '15m';

const REFRESH_SECRET = 'refresh_secret';
const REFRESH_EXPIRES_IN = '7d';

const refreshTokens = new Set();

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  )
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  )
}


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина автомобилей',
      version: '1.0.0',
      description: 'API для управления каталогом автомобилей',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

let users = [];

async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}]
${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});





(async () => {
  const adminPass = await hashPassword("admin123");
  const sellerPass = await hashPassword("seller123");
  const userPass = await hashPassword("user123");

  users.push(
    {
      id: nanoid(6),
      email: "admin@test.com",
      first_name: "Admin",
      last_name: "Test",
      role: "admin",
      hashedPassword: adminPass
    },
    {
      id: nanoid(6),
      email: "seller@test.com",
      first_name: "Seller",
      last_name: "Test",
      role: "seller",
      hashedPassword: sellerPass
    },
    {
      id: nanoid(6),
      email: "user@test.com",
      first_name: "User",
      last_name: "Test",
      role: "user",
      hashedPassword: userPass
    }
  );

  console.log("Тестовые пользователи добавлены");
})();




app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = req.user.role;

    const roleHierarchy = {
      admin: 3,
      seller: 2,
      user: 1,
      guest: 0
    };

    const maxAllowedLevel = Math.max(
      ...allowedRoles.map(role => roleHierarchy[role] || 0)
    );

    if (roleHierarchy[userRole] >= maxAllowedLevel) {
      return next();
    }
  };
}
function findUserOr404(id, res) {
  const user = users.find(p => p.id == id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return null;
  }
  return user;
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     description: Создает нового пользователя с хешированным паролем
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: primeremail@gmail.com
 *               first_name: 
 *                 type: string
 *                 example: Lev
 *               last_name: 
 *                 type: string
 *                 example: Gerasimov
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: primeremail@gmail.com
 *                 first_name: 
 *                   type: string
 *                   example: Lev
 *                 last_name: 
 *                   type: string
 *                   example: Gerasimov 
 *                 hashedPassword:
 *                   type: string
 *                   example: "$2b$10$kO6Hq7ZKfV4cPzGm8u7mEuR7r4Xx2p9mP0q3t1yZbCq9Lh5a8b1QW"
 *       400:
 *         description: Некорректные данные
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "email, first_name, last_name and password are required" });
  }

  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const newUser = {
    id: String(users.length + 1),
    email: email,
    first_name: first_name,
    last_name: last_name,
    role: "user",
    hashedPassword: await hashPassword(password)
  };

  users.push(newUser);

  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    role: newUser.role,
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     description: Проверяет логин и пароль пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: primeremail@gmail.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешная авторизация
  *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  refreshTokens.add(refreshToken);

  res.json({
    accessToken,
    refreshToken,
    role: user.role
  });

});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Возвращает данные текущего пользователя
 *     description: Получает информацию о пользователе из JWT токена
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Пользователь найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "1"
 *                 email:
 *                   type: string
 *                   example: "primeremail@gmail.com"
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;

  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role
  });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов доступа
 *     description: Обновляет токены доступа
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверный токен
 *       404:
 *         description: Пользователь с таким токеном не найден
 */
app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: "refreshToken is required",
    });
  }
  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    const user = users.find(u => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    refreshTokens.delete(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.add(newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

});

/**
 * @swagger
 * /api/users:
 *  get:
 *     security:
 *       - bearerAuth: []
 *     summary: Возвращает списко всею пользователей
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 */
app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  console.log(`Пользователи найдены пользователем: ${req.user.email}`);

  const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user);
  res.json(usersWithoutPasswords);
});


/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Получить пользователя по ID (только admin)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *         example: "1"
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.get("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const id = req.params.id;
  const user = findUserOr404(id, res);
  if (!user) return;

  console.log(`Пользователь ${id} найден: ${req.user.email}`);

  const { hashedPassword, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Обновить данные пользователя (только admin)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "newemail@example.com"
 *               first_name:
 *                 type: string
 *                 example: "НовоеИмя"
 *               last_name:
 *                 type: string
 *                 example: "НоваяФамилия"
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *                 example: "seller"
 *     responses:
 *       200:
 *         description: Пользователь обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Нет данных для обновления
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.put("/api/users/:id",authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const id = req.params.id;
  const user = findUserOr404(id, res);
  if (!user) return;

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const { email, first_name, last_name, role } = req.body;

  if (email !== undefined) user.email = email.trim();
  if (first_name !== undefined) user.first_name = first_name.trim();
  if (last_name !== undefined) user.last_name = last_name.trim();
  if (role !== undefined) user.role = role;


  console.log(`Пользователь ${id} обновлен: ${req.user.email}`);

  const { hashedPassword, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Удалить пользователя (только admin)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *         example: "1"
 *     responses:
 *       204:
 *         description: Пользователь успешно удалён (нет тела ответа)
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const id = req.params.id;
  const user = findUserOr404(id, res);
  if (!user) return;

  users = users.filter(u => u.id !== id);
  console.log(`Пользователь ${id} удален: ${req.user.email}`);
  res.status(204).send();
});

let products = [
  {
    id: nanoid(6),
    name: 'Audi A3 Sportback 35 TFSI IV (8Y), 2022',
    imageUrl: 'https://avatars.mds.yandex.net/get-autoru-vos/18154113/3706af415f26293c4d7529be9f9388de/1200x900n',
    category: 'Хэтчбек / Премиум',
    description: 'Стильный немецкий хэтчбек в максимальной комплектации. 1.5 TSI (150 л.с.), робот, передний привод. Цвет - серый металлик. Комплектация: кожаный салон, панорамная крыша, адаптивный круиз-контроль, камеры 360°, подогрев всех сидений, аудиосистема B&O. Один владелец, обслуживание у дилера.',
    price: 2280000,
    stock: 1
  },
  {
    id: nanoid(6),
    name: 'Mazda 3 Axela IV (BP), 2026',
    imageUrl: 'https://avatars.mds.yandex.net/get-autoru-vos/16757019/af71af5657b3d88c81fce1d2b61ea574/1200x900n',
    category: 'Седан / Бизнес',
    description: 'Новый японский седан 2026 года! 2.0 SKYACTIV-G (165 л.с.), автомат, полный привод. Цвет - бордовый перламутр. Комплектация Takumi: кожа Nappa, проекция на лобовое, 12 динамиков Bose, матричные фары, HUD-дисплей. Гарантия 5 лет, ТО в подарок.',
    price: 2769000,
    stock: 3
  },
  {
    id: nanoid(6),
    name: 'Honda Jazz I Рестайлинг, 2007',
    imageUrl: 'https://avatars.mds.yandex.net/get-verba/1030388/2a000001609d687668a5c08352437889e252/cattouchretcr',
    category: 'Хэтчбек / Эконом',
    description: 'Компактный и надежный городской автомобиль. 1.3 i-DSI (83 л.с.), механика, передний привод. Цвет - синий металлик. Пробег 180 000 км. Система "волшебные сиденья" (магический пол). Отличный вариант для первого автомобиля. Требуется небольшой косметический ремонт заднего бампера.',
    price: 625000,
    stock: 1
  },
  {
    id: nanoid(6),
    name: 'Kia Ceed III Рестайлинг, 2021',
    imageUrl: 'https://avatars.mds.yandex.net/get-autoru-vos/16989297/5c2d5d99c633a82aeb6f94198d732aaa/456x342',
    category: 'Универсал / Средний',
    description: 'Практичный универсал для семьи. 1.6 MPI (128 л.с.), автомат, передний привод. Цвет - белый. Пробег 65 000 км. Комплектация Prestige: большой багажник 625 л, подогрев руля и всех сидений, камера заднего вида, парктроники, двухзонный климат-контроль. Обслужен у дилера, новый аккумулятор.',
    price: 2200000,
    stock: 2
  },
  {
    id: nanoid(6),
    name: 'Audi Q8 50 TDI I (4M) Рестайлинг, 2025',
    imageUrl: 'https://avatars.mds.yandex.net/get-autoru-vos/18129838/e37bc8bfa1b0374410e9202eb304f594/456x342',
    category: 'Внедорожник / Люкс',
    description: 'Флагманский люксовый внедорожник 2025 года! 3.0 TDI (286 л.с.), автомат, полный привод. Цвет - черный металлик. Комплектация Vorsprung: пневмоподвеска, матричные лазерные фары HD Matrix, массаж передних сидений, 4-зонный климат, подогрев и вентиляция всех сидений, Bang & Olufsen Advanced 3D, ночное видение. Новый автомобиль с ПТС.',
    price: 14610079,
    stock: 1
  },
  {
    id: nanoid(6),
    name: 'Skoda Superb III Рестайлинг, 2025',
    imageUrl: 'https://auto.ironhorse.ru/wp-content/uploads/2015/10/superb-3-lb-fl-front.jpg',
    category: 'Лифтбек / Бизнес',
    description: 'Просторный лифтбек бизнес-класса нового поколения. 2.0 TSI (190 л.с.), DSG-7, передний привод. Цвет - лазурно-синий. Комплектация Laurin & Klement: вентиляция передних сидений, адаптивный круиз, Canton sound system, виртуальная приборная панель, электропривод багажника с памятью, обогрев лобового стекла. Гарантия 4 года.',
    price: 3200000,
    stock: 2
  },
  {
    id: nanoid(6),
    name: 'Kia K5 III, 2020',
    imageUrl: 'https://avatars.mds.yandex.net/get-autoru-vos/17640555/e759bdd779f541e7010eb55ae2b30fec/456x342',
    category: 'Седан / Бизнес',
    description: 'Стильный бизнес-седан с узнаваемым дизайном. 2.5 GDI (194 л.с.), автомат, передний привод. Цвет - темно-серый. Пробег 45 000 км. Комплектация GT Line: панорама, JBL Premium, вентиляция передних сидений, подогрев заднего ряда, проекция, камеры 360°. Один владелец, полная история обслуживания.',
    price: 2290000,
    stock: 1
  },
  {
    id: nanoid(6),
    name: 'Suzuki Jimny IV, 2025',
    imageUrl: 'https://www.ixbt.com/img/n1/news/2024/11/1/jwEFyZFy90Jx2ufOGyvT_large.jpg',
    category: 'Внедорожник / Средний',
    description: 'Легендарный рамный внедорожник 2025 года! 1.5 (102 л.с.), автомат, полный привод с понижайкой. Цвет - матовый зеленый хаки. Комплектация GLX: кондиционер, магнитола с Apple CarPlay, подогрев сидений, ABS, ESP. Новый автомобиль под заказ. Настоящий внедорожный характер в компактном корпусе!',
    price: 3850000,
    stock: 0
  },
  {
    id: nanoid(6),
    name: 'Ford F-150 SuperCrew XIV Рестайлинг, 2025',
    imageUrl: 'https://avatars.mds.yandex.net/get-autoru-vos/17413889/e65b1e20bec85a6498fc59da86cdbe5b/1200x900n',
    category: 'Пикап / Люкс',
    description: 'Мощный американский пикап в люксовой комплектации. 3.5 EcoBoost V6 (450 л.с.), 10-ступенчатый автомат, полный привод. Цвет - белый перламутр. Комплектация Limited: кожаный салон с массажем, панорама, система кругового обзора, автопилот 2 уровня, подогрев и вентиляция всех сидений, аудиосистема B&O 18 динамиков, электропривод крышки багажника. Огромный выбор опций для бизнеса и путешествий.',
    price: 11451143,
    stock: 2
  },
  {
    id: nanoid(6),
    name: 'Mercedes-Benz GLS 500 I (X166), 2016',
    imageUrl: 'https://avatars.mds.yandex.net/get-autoru-vos/5232449/79a636b44db3d4e138b165dd4b1bbc82/1200x900n',
    category: 'Внедорожник / Премиум',
    description: 'Представительский внедорожник с историей. 4.7 V8 Biturbo (455 л.с.), автомат 9G-Tronic, полный привод. Цвет - белый. Пробег 120 000 км. Комплектация: семиместный салон, пневмоподвеска Airmatic, система стабилизации, вентиляция и массаж передних сидений, климат-контроль 4 зоны, гардеробная система, кожа Designo, подогрев всех сидений. Состояние идеальное, все опции работают.',
    price: 4749000,
    stock: 1
  }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *         email:
 *           type: string
 *           example: "user@exampl.com"
 *         first_name:
 *           type: string
 *           example: "Иван"
 *         last_name:
 *           type: string
 *           example: "Петров"
 *         role:
 *           type: string
 *           enum: [user, seller, admin]
 *           example: "user"
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара
 *           example: "abc123"
 *         name:
 *           type: string
 *           description: Название товара
 *           example: "Audi A3 Sportback 35 TFSI IV (8Y), 2022"
 *         category:
 *           type: string
 *           description: Категория товара
 *           example: "Хэтчбек / Премиум"
 *         description:
 *           type: string
 *           description: Подробное описание товара
 *           example: "Стильный немецкий хэтчбек в максимальной комплектации..."
 *         price:
 *           type: number
 *           description: Цена в рублях
 *           example: 2280000
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *           example: 1
 *         imageUrl:
 *           type: string
 *           description: Ссылка на изображение
 *           example: "https://example.com/audi-a3.jpg"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Сообщение об ошибке
 *           example: "Product not found"
 */

function findProductOr404(id, res) {
  const product = products.find(p => p.id == id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}


/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Получает товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *         example: "abc123"
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  console.log(`Товар найден пользователем: ${req.user.email}`);
  res.json(product);
});


/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *               - imageUrl
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Новый автомобиль"
 *               category:
 *                 type: string
 *                 example: "Седан / Бизнес"
 *               description:
 *                 type: string
 *                 example: "Описание нового автомобиля"
 *               price:
 *                 type: number
 *                 example: 2500000
 *               stock:
 *                 type: integer
 *                 example: 5
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/car.jpg"
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка в данных запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post("/api/products", authMiddleware, roleMiddleware(["seller"]), (req, res) => {
  const { name, category, description, price, stock, imageUrl } = req.body;

  if (!name || !category || !description || !price || !stock || !imageUrl) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const newProduct = {
    id: nanoid(6),
    name: name?.trim(),
    category: category?.trim(),
    description: description?.trim(),
    price: Number(price),
    stock: Number(stock),
    imageUrl: imageUrl?.trim()
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Обновляет существующий товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Обновленное название"
 *               category:
 *                 type: string
 *                 example: "Обновленная категория"
 *               description:
 *                 type: string
 *                 example: "Обновленное описание"
 *               price:
 *                 type: number
 *                 example: 3000000
 *               stock:
 *                 type: integer
 *                 example: 10
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/new-image.jpg"
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller"]), (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const { name, category, description, price, stock, imageUrl } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (imageUrl !== undefined) product.imageUrl = imageUrl.trim();

  console.log(`Товар обновлен пользователем: ${req.user.email}`);
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []       
 *     summary: Удаляет товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  products = products.filter(p => p.id !== id);
  console.log(`Товар удален пользователем: ${req.user.email}`);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});
