// public/script.js

document.addEventListener("DOMContentLoaded", async function() {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    const initData = tg.initData;
  
    if (!initData) {
      alert('Ошибка: не удалось получить данные авторизации из Telegram.');
      return;
    }
  
    // Отправляем initData на сервер для проверки и получения информации о пользователе
    let user = await getUserFromServer(initData);
  
    if (!user) {
      alert('Ошибка при получении данных пользователя.');
      return;
    }
  
    // Проверяем, есть ли у пользователя бабочка
    if (user.has_butterfly) {
      showMainScreen();
    } else {
      showStartScreen();
    }
  
    // Функции для работы с сервером
    async function getUserFromServer(initData) {
      try {
        const response = await fetch('/api/getUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });
        if (response.ok) {
          return await response.json();
        } else {
          console.error('Ошибка при получении пользователя с сервера.');
          return null;
        }
      } catch (error) {
        console.error('Ошибка сети при получении пользователя:', error);
        return null;
      }
    }
  
    async function updateUserOnServer(data) {
      try {
        const response = await fetch('/api/updateUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, data }),
        });
        if (response.ok) {
          user = await response.json();
          return user;
        } else {
          console.error('Ошибка при обновлении пользователя на сервере.');
          return null;
        }
      } catch (error) {
        console.error('Ошибка сети при обновлении пользователя:', error);
        return null;
      }
    }
  
    // Функции для отображения экранов
    function showStartScreen() {
      hideAllScreens();
      document.getElementById('start-screen').style.display = 'block';
    }
  
    function showMainScreen() {
      hideAllScreens();
      document.getElementById('main-screen').style.display = 'block';
      updateUI();
    }
  
    // Обработчик кнопки "Get"
    document.getElementById('get-button').addEventListener('click', async function() {
      user.has_butterfly = true;
      await updateUserOnServer({ has_butterfly: true });
      showMainScreen();
    });
  
    // Обновление интерфейса пользователя
    function updateUI() {
      document.querySelector('.level').textContent = `${user.level} LVL`;
      const progressPercentage = (user.points / (user.level * 5)) * 100;
      document.querySelector('.progress').style.width = `${progressPercentage}%`;
    }
  
    // Функции для навигации
    window.openHome = function() {
      showMainScreen();
    };
  
    window.openFriends = function() {
      hideAllScreens();
      document.getElementById('friends-screen').style.display = 'block';
      document.getElementById('referral-link').textContent = `https://t.me/your_bot?start=${user.referral_code}`;
    };
  
    window.openTasks = function() {
      hideAllScreens();
      document.getElementById('tasks-screen').style.display = 'block';
    };
  
    window.openMarket = function() {
      hideAllScreens();
      document.getElementById('market-screen').style.display = 'block';
    };
  
    window.goBack = function() {
      showMainScreen();
    };
  
    function hideAllScreens() {
      document.getElementById('start-screen').style.display = 'none';
      document.getElementById('main-screen').style.display = 'none';
      document.getElementById('friends-screen').style.display = 'none';
      document.getElementById('tasks-screen').style.display = 'none';
      document.getElementById('market-screen').style.display = 'none';
    }
  
    // Дополнительные функции для обновления уровня и очков
    async function updateLevel(points) {
      user.points += points;
      const requiredPoints = user.level * 5;
  
      if (user.points >= requiredPoints) {
        user.level += 1;
        user.points -= requiredPoints;
      }
  
      updateUI();
      await updateUserOnServer({ points: user.points, level: user.level });
    }
  
    // Пример использования updateLevel
    // updateLevel(10); // Добавить 10 очков пользователю
  });
  