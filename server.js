const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');  // Додано для обробки статичних файлів

const app = express();
const port = process.env.PORT || 3000;

// Підключення до PostgreSQL через змінну середовища
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,  // Використовуємо змінну середовища для PostgreSQL на Render
    ssl: { rejectUnauthorized: false }  // SSL підключення, необхідне для Render
});

app.use(bodyParser.json());

// Обслуговування статичних файлів (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для кореневого шляху
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Відправляємо HTML-файл
});

// API для створення або оновлення користувача
app.post('/api/users', async (req, res) => {
    const { id, name, points, level, friends, referralCode, friendsList, referredBy } = req.body;

    try {
        // Перевірка, чи користувач вже існує
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            // Створення нового користувача
            await pool.query(
                'INSERT INTO users (id, name, points, level, friends, referralCode, friendsList, referredBy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [id, name, points, level, friends, referralCode, friendsList, referredBy]
            );
        } else {
            // Оновлення наявного користувача
            await pool.query(
                'UPDATE users SET points = $1, level = $2, friends = $3, referralCode = $4, friendsList = $5, referredBy = $6 WHERE id = $7',
                [points, level, friends, referralCode, friendsList, referredBy, id]
            );
        }
        res.status(200).send({ message: 'User data saved or updated' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// API для отримання користувача за ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        res.send(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Запуск сервера
app.listen(port, () => console.log(`Listening on port ${port}`));
