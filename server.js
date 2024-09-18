require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

// Підключення до PostgreSQL через змінні оточення
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432
});

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));  // Для статичних файлів, таких як index.html

// API для створення або оновлення користувача
app.post('/api/users', async (req, res) => {
    const { id, name, points, level, friends, referralCode, friendsList, referredBy } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            await pool.query(
                'INSERT INTO users (id, name, points, level, friends, referralCode, friendsList, referredBy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [id, name, points, level, friends, referralCode, friendsList, referredBy]
            );
            res.status(201).json({ message: 'New user created successfully' });
        } else {
            await pool.query(
                'UPDATE users SET points = $1, level = $2, friends = $3, referralCode = $4, friendsList = $5, referredBy = $6 WHERE id = $7',
                [points, level, friends, referralCode, friendsList, referredBy, id]
            );
            res.status(200).json({ message: 'User data updated successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during user update' });
    }
});

// API для отримання користувача за ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during fetching user data' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
