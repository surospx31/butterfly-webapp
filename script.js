const backendUrl = 'https://butterfly-webapp.onrender.com/'; // Замініть на ваш реальний URL бекенду

document.addEventListener("DOMContentLoaded", function() {
    const initData = window.Telegram.WebApp.initData;
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    const referralCode = window.Telegram.WebApp.initDataUnsafe.start_param;

    if (user) {
        console.log("Ім'я користувача: ", user.first_name);
        loadUserData(user.id)
            .then(userData => {
                if (!userData) {
                    userData = {
                        id: user.id,
                        name: user.first_name,
                        points: 0,
                        level: 1,
                        friends: 0,
                        referralCode: generateReferralCode(),
                        friendsList: [],
                        referredBy: referralCode || null
                    };
                    saveToDatabase(userData);
                }

                // Показуємо екран з метеликом і кнопкою CLAIM
                document.getElementById("main-screen").style.display = "block";

                if (referralCode) {
                    console.log(`Користувача запросив ${referralCode}`);
                    processReferral(referralCode, userData.id);
                }
            })
            .catch(err => console.error('Error loading user data:', err));
    } else {
        alert("Не вдалося отримати дані користувача.");
    }
});

// Кнопка CLAIM
document.getElementById("claim-button").addEventListener("click", function() {
    document.getElementById("main-screen").style.display = "none";
    document.getElementById("interface-screen").style.display = "block";

    updateLevel(0); // Початковий рівень 1
});

// Генерація унікального реферального коду
function generateReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Оновлення рівня і прогрес бару
function updateLevel(points) {
    loadUserData(window.Telegram.WebApp.initDataUnsafe.user.id)
        .then(userData => {
            let requiredPoints = (userData.level) * 5;
            userData.points += points;

            if (userData.points >= requiredPoints) {
                userData.level += 1;
                userData.points = 0;
                requiredPoints = (userData.level) * 5;
            }

            const progressPercentage = (userData.points / requiredPoints) * 100;
            document.querySelector(".progress").style.width = `${progressPercentage}%`;
            document.querySelector(".level").textContent = `${userData.level} LVL`;

            saveToDatabase(userData);
        })
        .catch(err => console.error('Error updating level:', err));
}

// Збереження даних користувача в базу даних через API
function saveToDatabase(userData) {
    fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => console.log('User data saved:', data))
    .catch(err => console.error('Error saving user data:', err));
}

// Завантаження даних користувача з бази даних через API
function loadUserData(userId) {
    return fetch(`${backendUrl}/api/users/${userId}`)
        .then(response => {
            if (!response.ok) throw new Error('User not found');
            return response.json();
        });
}

// Обробка реферального коду
function processReferral(referralCode, newUserId) {
    fetch(`${backendUrl}/api/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode, newUserId })
    })
    .then(response => response.json())
    .then(data => console.log('Referral processed:', data))
    .catch(err => console.error('Error processing referral:', err));
}

// Відкриття основного екрану
function openMain() {
    document.getElementById("interface-screen").style.display = "none";
    document.getElementById("main-screen").style.display = "block";
}

// Відкриття сторінки друзів
function openFriends() {
    document.getElementById("interface-screen").style.display = "none";
    document.getElementById("friends-screen").style.display = "block";

    const userData = loadUserData(window.Telegram.WebApp.initDataUnsafe.user.id)
        .then(userData => {
            showFriendsList(userData.id);
            document.getElementById("referral-link").textContent = `Your referral link: https://t.me/YOUR_BOT_USERNAME?start=${userData.referralCode}`;
        })
        .catch(err => console.error('Error loading user data:', err));
}

// Показ списку друзів
function showFriendsList(userId) {
    fetch(`${backendUrl}/api/users/${userId}/friends`)
        .then(response => response.json())
        .then(friends => {
            const friendsList = document.getElementById("friends-list");
            friendsList.innerHTML = '';

            friends.forEach(friend => {
                const friendItem = document.createElement('p');
                friendItem.textContent = `${friend.name} (ID: ${friend.id})`;
                friendsList.appendChild(friendItem);
            });
        })
        .catch(err => console.error('Error loading friends list:', err));
}

// Відкриття сторінки завдань
function openTasks() {
    document.getElementById("interface-screen").style.display = "none";
    document.getElementById("tasks-screen").style.display = "block";

    const tasks = [
        { id: 1, description: "Subscribe to Telegram Channel", points: 10 },
        { id: 2, description: "Invite a friend", points: 5 }
    ];

    const tasksList = document.getElementById("tasks-list");
    tasksList.innerHTML = tasks.map(task => `<p>${task.description} - ${task.points} points <button onclick="completeTask(${task.points})">Complete</button></p>`).join("");
}

// Функція для завершення завдання та збільшення рівня
function completeTask(points) {
    updateLevel(points); // Додаємо поінти за виконане завдання
    alert(`Завдання виконано! Ви отримали ${points} поінтів.`);
}

// Відкриття сторінки маркету
function openMarket() {
    document.getElementById("interface-screen").style.display = "none";
    document.getElementById("market-screen").style.display = "block";
}

// Повернення назад
function goBack() {
    document.getElementById("friends-screen").style.display = "none";
    document.getElementById("tasks-screen").style.display = "none";
    document.getElementById("market-screen").style.display = "none";
    document.getElementById("interface-screen").style.display = "block";
}
