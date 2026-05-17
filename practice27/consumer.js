import amqplib from 'amqplib';

const MAX_RETRIES = 3;
const WORKER_ID = process.env.WORKER_ID || '1';

async function startConsumerWithDLQ() {
    const connection = await amqplib.connect('amqp://localhost');
    const channel = await connection.createChannel();

    channel.prefetch(1);

    channel.consume('main_queue', async (msg) => {
        if (!msg) return;
        const data = JSON.parse(msg.content.toString());
        console.log(`[Worker ${WORKER_ID}] Обработка задачи: ${data.id}`);
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);
        console.log(`[Consumer] Попытка ${retryCount + 1}/${MAX_RETRIES}:`, data);

        try {
            await processMessage(data);
            console.log(`[Worker ${WORKER_ID}] Задача ${data.id} выполнена`);
            channel.ack(msg);
        } catch (err) {
            console.error(`[Consumer] Ошибка: ${err.message}`);
            if (retryCount < MAX_RETRIES) {
                // Повторная публикация с увеличенным счётчиком
                channel.nack(msg, false, false); // Отклоняем без возврата в очередь
                const delay = 1000 * 2 ** retryCount;
                await new Promise(resolve => setTimeout(resolve, delay));
                channel.sendToQueue('main_queue',
                    msg.content,
                    {
                        persistent: true, headers: { 'x-retry-count': retryCount + 1 },
                    });
            } else {
                // Исчерпали попытки — сообщение уйдёт в DLQ через nack
                console.error(`[Consumer] Сообщение отправлено в DLQ после ${MAX_RETRIES} попыток`);
                channel.nack(msg, false, false);
            }
        }
    });
    console.log(`[Worker ${WORKER_ID}] Запущен, ожидание задач...`);
}

async function processMessage(data) {
    if (Math.random() < 0.8) throw new Error('Processing failed');
    console.log('[Consumer] Сообщение успешно обработано:', data);
}
await startConsumerWithDLQ();