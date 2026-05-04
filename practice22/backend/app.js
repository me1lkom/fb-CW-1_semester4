const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID;

app.get('/', (req, res) => {
    res.json({
        message: "Hello!",
        port: PORT
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер ${SERVER_ID} запущен на http://localhost:${PORT}`);
})