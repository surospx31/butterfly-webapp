// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());

// Настройка соединения с PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Маршрут для получения пользователя
app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка получения пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршрут для создания нового пользователя
app.post('/api/user', async (req, res) => {
  try {
    const { id, name, points, level, referral_code, friends } = req.body;
    const result = await pool.query(
      'INSERT INTO users (id, name, points, level, referral_code, friends) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, points, level, referral_code, friends]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка создания пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршрут для обновления пользователя
app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { points, level } = req.body;
    const result = await pool.query(
      'UPDATE users SET points = $1, level = $2 WHERE id = $3 RETURNING *',
      [points, level, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка обновления пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запуск сервера
app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
