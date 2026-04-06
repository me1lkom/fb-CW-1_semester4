const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const reminders = new Map();

const vapidKeys = {
    publicKey: 'BOF9JdIvCpLC-LCl9aMeRXkAj0H82ALVkUwWrqznDf591H8trKF4EjrnqfRaL_TlQgsIOJZRWzb2OGRukzHQaGU',
    privateKey: '2Am9uP2pt7Py4Yt6PB85QIKv3Sl9iQ5FaxBQGz_FN3A'
};

webpush.setVapidDetails(
    'mailto:leva.gerasimov@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../notes-app')));

let subscriptions = [];

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log('Клиент подключён:', socket.id);

    // Обработка события 'newTask' от клиента
    socket.on('newTask', (task) => {
        console.log('newTask получена:', task);
        io.emit('taskAdded', task);
        const payload = JSON.stringify({
            title: 'Новая задача',
            body: task.text
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err =>
                console.error('Push error:', err));
        });
    });

    // Обработка newReminder
    socket.on('newReminder', (reminder) => {
    console.log('newReminder получена:', reminder);
    const { id, text, reminderTime } = reminder;
    const now = Date.now();
    const delay = reminderTime - now;
    
    const timeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: '!!! Напоминание',
            body: text,
            reminderId: id
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err =>
                console.error('Push error:', err));
        });
        reminders.delete(id);
    }, delay);
    reminders.set(id, { timeoutId, text, reminderTime });
});

    socket.on('disconnect', () => {
        console.log('Клиент отключён:', socket.id);
    });
});

// Эндпоинты для управления push-подписками
app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    console.log('Новая подписка, всего:', subscriptions.length);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('Подписка удалена, осталось:', subscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

// Эндпоинт для откладывания напоминания
app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found' });
    }
    const reminder = reminders.get(reminderId);
    clearTimeout(reminder.timeoutId);
    const newDelay = 5 * 60 * 1000;
    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: 'Напоминание отложено',
            body: reminder.text,
            reminderId: reminderId
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err =>
                console.error('Push error:', err));
        });
        reminders.delete(reminderId);
    }, newDelay);
    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + newDelay
    });
    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});