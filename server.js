// server.js
require('dotenv').config();
console.log('Загруженные переменные окружения:', process.env);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
const express = require('express');
const { Pool } = require('pg');
const { Telegraf } = require('telegraf');
const path = require('path');

const app = express();
app.use(express.json());

// Настройка базы данных
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Настройка бота
const bot = new Telegraf('7024273953:AAHw4j1J-lgR-ABrxuZdXrYA1LrDR-Go1L4');

// Обработка команды /start
bot.start(async (ctx) => {
  let referral_code = null;
  if (ctx.startPayload) {
    referral_code = ctx.startPayload; // Реферальный код
  }

  // Проверяем, существует ли пользователь
  const telegram_id = ctx.from.id;
  let user = await getUserByTelegramId(telegram_id);

  if (!user) {
    // Создаём нового пользователя
    const newReferralCode = generateReferralCode();
    await createUser(telegram_id, newReferralCode, referral_code);
  }

  // Отправляем сообщение с кнопкой, открывающей веб-приложение
  const url = `${process.env.WEBAPP_URL}/?telegram_id=${telegram_id}`;
  await ctx.reply('Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть приложение', web_app: { url } }],
      ],
    },
  });
});

// Функции для работы с базой данных
async function getUserByTelegramId(telegram_id) {
  const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
  return result.rows[0];
}

async function createUser(telegram_id, referral_code, referred_by) {
  await pool.query(
    'INSERT INTO users (telegram_id, referral_code, referred_by) VALUES ($1, $2, $3)',
    [telegram_id, referral_code, referred_by]
  );
  if (referred_by) {
    // Увеличиваем количество друзей у того, кто пригласил
    await pool.query('UPDATE users SET friends = friends + 1 WHERE referral_code = $1', [referred_by]);
  }
}

function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Запуск бота
bot.launch();

// Обработка запросов от веб-приложения
app.post('/api/getUser', async (req, res) => {
  const { telegram_id } = req.body;
  try {
    const user = await getUserByTelegramId(telegram_id);
    res.json(user);
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/updateUser', async (req, res) => {
  const { telegram_id, data } = req.body;
  try {
    const fields = [];
    const values = [];
    let index = 1;

    for (const key in data) {
      fields.push(`${key} = $${index}`);
      values.push(data[key]);
      index++;
    }

    values.push(telegram_id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE telegram_id = $${index}`;
    await pool.query(query, values);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
