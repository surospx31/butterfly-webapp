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

// Створення або отримання користувача
app.post('/api/users', async (req, res) => {
    const { id, name, points = 0, level = 1, referralCode, referredBy } = req.body;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM users WHERE id=$1', [id]);

        if (result.rows.length === 0) {
            // Додаємо нового користувача
            const insertQuery = `
                INSERT INTO users (id, name, points, level, referral_code, referred_by) 
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
            const newUser = await client.query(insertQuery, [id, name, points, level, referralCode, referredBy]);
            res.json(newUser.rows[0]);
        } else {
            // Користувач вже існує
            res.json(result.rows[0]);
        }
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка збереження даних користувача');
    }
});

// Обробка реферального коду
app.post('/api/referrals', async (req, res) => {
    const { referralCode, newUserId } = req.body;
    try {
        const client = await pool.connect();
        const referrer = await client.query('SELECT * FROM users WHERE referral_code=$1', [referralCode]);

        if (referrer.rows.length > 0) {
            const referrerId = referrer.rows[0].id;
            await client.query('UPDATE users SET points = points + 10 WHERE id = $1', [referrerId]);  // Наприклад, 10 поінтів за друга
            await client.query('INSERT INTO friends(referrer_id, friend_id) VALUES ($1, $2)', [referrerId, newUserId]);
            res.send('Referral оброблений');
        } else {
            res.status(400).send('Невірний реферальний код');
        }

        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Помилка обробки рефералу');
    }
});

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Сервер запущений на порту ${port}`);
});