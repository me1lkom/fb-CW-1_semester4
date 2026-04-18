const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = 3000;

app.use(express.json());

const sequelize = new Sequelize('practice19', 'levgerasimov', '', {
    host: 'localhost',
    dialect: 'postgres'
});


const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'first_name'
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'last_name'
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        field: 'created_at'
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        field: 'updated_at'
    }
}, {
    tableName: 'users',
    timestamps: false
});



sequelize.authenticate()
    .then(() => console.log('Успешное подключение'))
    .then(() => sequelize.sync({ alter: true }))
    .then(() => console.log('Таблице user синхронизирована'))
    .catch(err => console.log('Ошибка подключения', err));

app.get('/', (req, res) => {
    res.send('API работает');
})



app.post('/api/users', async (req, res) => {
    try {
        const { first_name, last_name, age } = req.body;

        const user = await User.create({
            first_name,
            last_name,
            age
        });
        res.status(201).json(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' })
        }

        res.json(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.patch('/api/users/:id', async (req, res) => {
    try {
        const user = await User.update(
            { ...req.body, updated_at: new Date() },
            {
                where: { id: req.params.id },
                returning: true
            }
        )

        if (user === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.send(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.destroy({ where: { id: req.params.id } });

        if (user === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.send({ message: 'Пользователь удален' });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
})

