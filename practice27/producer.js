import amqplib from 'amqplib';
import express from 'express';

const app = express();
app.use(express.json());

let channel;

async function connected() {
    const connection = await amqplib.connect('amqp://localhost');
    channel = await connection.createChannel();
    console.log(`[Producer] rabbitMQ подключен}`);
}


app.post('/tasks', async (req, res) => {
    const { type, payload } = req.body;

    try {
        if (!type || !payload) {
            return res.status(400).json({ error: 'Ошибка, пустые поля!' });
        }

        const task = {
            id: Date.now().toString(),
            type,
            payload,
        }

        channel.sendToQueue(
            'main_queue',
            Buffer.from(JSON.stringify(task)),
            { persistent: true }
        )

        console.log(`[Producer] задача отправлена: ${task.id} (${task.type})`);
        res.status(201).json({ message: `Задача создана ${task}` })

    } catch (err) {
        res.status(500).json({ error: "Мы уже работает над исправлением ошибки." })
    }
})


await connected();
app.listen(3000, () => {
    console.log('http://localhost:3000');
})