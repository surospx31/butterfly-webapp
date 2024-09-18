const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// Ініціалізуємо сервер
const app = express();
const PORT = process.env.PORT || 10000;

// Підключення до PostgreSQL
const pool = new Pool({
    user: 'wellact_db_user',
    host: 'dpg-crlaf0ogph6c73e2g770-a.oregon-postgres.render.com',  // Заміни на зовнішній URL бази даних
    database: 'wellact_db',
    password: 'Bp5fQmpuNbyUKeEVxyU7Ccv4ouuGvAHT',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// Middleware для обробки JSON та CORS
app.use(cors());
app.use(express.json());
app.use(express.static('public'));  // Для обробки статичних файлів, таких як index.html, стилі та скрипти

// Маршрут для перевірки стану сервера
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Маршрут для отримання всіх користувачів з бази даних
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка отримання даних' });
    }
});

// Маршрут для додавання користувача в базу
app.post('/api/users', async (req, res) => {
    const { id, name, points, level, referralCode, referredBy } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (id, name, points, level, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, name, points, level, referralCode, referredBy]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка збереження даних' });
    }
});

// Маршрут для оновлення даних користувача
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { points, level, friends } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET points = $1, level = $2, friends = $3 WHERE id = $4 RETURNING *',
            [points, level, friends, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка оновлення даних' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущений на порту ${PORT}`);
});
