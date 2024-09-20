// server.js

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { Telegraf } = require('telegraf');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Настройка подключения к базе данных PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,       // Ваш пользователь базы данных
  host: process.env.DB_HOST,       // Адрес хоста базы данных
  database: process.env.DB_NAME,   // Имя базы данных
  password: process.env.DB_PASSWORD, // Пароль базы данных
  port: process.env.DB_PORT,       // Порт базы данных (обычно 5432)
  ssl: {
    rejectUnauthorized: false,     // Установите в true в производственной среде
  },
});

// Проверка подключения к базе данных
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Ошибка подключения к базе данных:', err.stack);
  }
  console.log('Успешное подключение к базе данных');
  release();
});

// Настройка бота Telegraf
const bot = new Telegraf(process.env.BOT_TOKEN); // Токен бота из файла .env

// Обработка команды /start
bot.start(async (ctx) => {
  try {
    let referral_code = null;
    if (ctx.startPayload) {
      referral_code = ctx.startPayload; // Реферальный код
    }

    const telegram_id = ctx.from.id;

    // Проверяем, существует ли пользователь
    let user = await getUserByTelegramId(telegram_id);

    if (!user) {
      // Создаем нового пользователя
      const newReferralCode = generateReferralCode();
      await createUser(telegram_id, newReferralCode, referral_code);
    }

    // Отправляем сообщение с кнопкой для открытия веб-приложения
    const url = `${process.env.WEBAPP_URL}`; // URL вашего веб-приложения
    await ctx.reply('Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть приложение', web_app: { url } }],
        ],
      },
    });
  } catch (error) {
    console.error('Произошла ошибка в обработчике /start:', error);
    await ctx.reply('Произошла ошибка на сервере. Пожалуйста, попробуйте позже.');
  }
});

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен');
}).catch((err) => {
  console.error('Ошибка запуска бота:', err);
});

// Функции для работы с базой данных
async function getUserByTelegramId(telegram_id) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    throw error;
  }
}

async function createUser(telegram_id, referral_code, referred_by) {
  try {
    await pool.query(
      'INSERT INTO users (telegram_id, referral_code, referred_by) VALUES ($1, $2, $3)',
      [telegram_id, referral_code, referred_by]
    );
    if (referred_by) {
      // Увеличиваем количество друзей у того, кто пригласил
      await pool.query('UPDATE users SET friends = friends + 1 WHERE referral_code = $1', [referred_by]);
    }
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    throw error;
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

// Проверка подлинности данных Telegram Web App
function checkTelegramAuth(initData) {
  const secretKey = crypto.createHash('sha256').update(process.env.BOT_TOKEN).digest();
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  const dataCheckString = [...urlParams.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return hmac === hash;
}

// Маршрут для получения или создания пользователя
app.post('/api/getUser', async (req, res) => {
  const { initData } = req.body;

  if (!checkTelegramAuth(initData)) {
    return res.status(403).json({ error: 'Недействительные данные авторизации Telegram' });
  }

  const urlParams = new URLSearchParams(initData);
  const userData = JSON.parse(urlParams.get('user'));
  const telegram_id = userData.id;
  const first_name = userData.first_name || '';
  const last_name = userData.last_name || '';
  const username = userData.username || '';

  try {
    let user = await getUserByTelegramId(telegram_id);

    if (!user) {
      // Создаем нового пользователя
      const newUser = {
        telegram_id: telegram_id,
        name: `${first_name} ${last_name}`.trim() || username || 'NoName',
        has_butterfly: false,
        level: 1,
        points: 0,
        referral_code: generateReferralCode(),
        friends: 0
      };

      await pool.query(
        'INSERT INTO users (telegram_id, name, has_butterfly, level, points, referral_code, friends) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          newUser.telegram_id,
          newUser.name,
          newUser.has_butterfly,
          newUser.level,
          newUser.points,
          newUser.referral_code,
          newUser.friends
        ]
      );

      user = newUser;
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при обработке запроса /api/getUser:', error);
    res.status(500).json({ error: 'Ошибка сервера при обработке запроса' });
  }
});

// Маршрут для обновления данных пользователя
app.post('/api/updateUser', async (req, res) => {
  const { initData, data } = req.body;

  if (!checkTelegramAuth(initData)) {
    return res.status(403).json({ error: 'Недействительные данные авторизации Telegram' });
  }

  const urlParams = new URLSearchParams(initData);
  const userData = JSON.parse(urlParams.get('user'));
  const telegram_id = userData.id;

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

    const query = `UPDATE users SET ${fields.join(', ')} WHERE telegram_id = $${index} RETURNING *`;
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении пользователя' });
  }
});

// Обслуживание статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
