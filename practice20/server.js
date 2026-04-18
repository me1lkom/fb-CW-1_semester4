const mongoose = require('mongoose');
const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());


mongoose.connect('mongodb://localhost:27017/practice20')
    .then(() => console.log('Успешное подключение'))
    .catch(err => console.log('Ошибка подключения', err));

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        min: 18,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.send('API работает');
});

app.post('/api/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).send(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const user = await User.find();
        res.status(201).send(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).send('Пользователь не найден');

        res.status(201).send(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.patch('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: new Date() },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).send('Пользователь не найден');
        
        res.status(201).send(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
})

app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) return res.status(404).send('Пользователь не найден');

        res.status(201).send('Пользователь удален');
    } catch (err) {
        res.status(400).send(err.message);
    }
})

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
})