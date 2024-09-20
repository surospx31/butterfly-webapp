// public/script.js
let user = null;

document.addEventListener("DOMContentLoaded", async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const telegram_id = urlParams.get('telegram_id');

  if (!telegram_id) {
    alert('Ошибка: отсутствует идентификатор пользователя');
    return;
  }

  // Получаем данные пользователя с сервера
  user = await getUserFromServer(telegram_id);

  if (user.has_butterfly) {
    showMainScreen();
  } else {
    showStartScreen();
  }
});

async function getUserFromServer(telegram_id) {
  try {
    const response = await fetch('/api/getUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id }),
    });
    return await response.json();
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
  }
}

async function updateUserOnServer(data) {
  try {
    await fetch('/api/updateUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: user.telegram_id, data }),
    });
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
  }
}

function showStartScreen() {
  document.getElementById('start-screen').style.display = 'block';
}

function showMainScreen() {
  document.getElementById('main-screen').style.display = 'block';
  updateUI();
}

document.getElementById('get-button').addEventListener('click', async function() {
  user.has_butterfly = true;
  await updateUserOnServer({ has_butterfly: true });
  document.getElementById('start-screen').style.display = 'none';
  showMainScreen();
});

function updateUI() {
  document.querySelector('.level').textContent = `${user.level} LVL`;
  const progressPercentage = (user.points / (user.level * 5)) * 100;
  document.querySelector('.progress').style.width = `${progressPercentage}%`;
}

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

// Обработчики кнопок меню
function openHome() {
  hideAllScreens();
  document.getElementById('main-screen').style.display = 'block';
}

function openFriends() {
  hideAllScreens();
  document.getElementById('friends-screen').style.display = 'block';
  document.getElementById('referral-link').textContent = `https://t.me/your_bot?start=${user.referral_code}`;
}

function openTasks() {
  hideAllScreens();
  document.getElementById('tasks-screen').style.display = 'block';
}

function openMarket() {
  hideAllScreens();
  document.getElementById('market-screen').style.display = 'block';
}

function goBack() {
  openHome();
}

function hideAllScreens() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('friends-screen').style.display = 'none';
  document.getElementById('tasks-screen').style.display = 'none';
  document.getElementById('market-screen').style.display = 'none';
}
