document.addEventListener("DOMContentLoaded", function() {
    const initData = window.Telegram.WebApp.initData;
    const user = window.Telegram.WebApp.initDataUnsafe ? window.Telegram.WebApp.initDataUnsafe.user : null;
    const referralCode = window.Telegram.WebApp.initDataUnsafe ? window.Telegram.WebApp.initDataUnsafe.start_param : null;

    if (user) {
        console.log("Ім'я користувача: ", user.first_name);
        const userData = {
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

        document.getElementById("main-screen").style.display = "block";

        if (referralCode) {
            console.log(`Користувача запросив ${referralCode}`);
            processReferral(referralCode, userData.id);
        }
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

// Збереження даних користувача
function saveToDatabase(userData) {
    let allUsers = JSON.parse(localStorage.getItem("allUsers")) || [];
    const existingUserIndex = allUsers.findIndex(user => user.id === userData.id);

    if (existingUserIndex >= 0) {
        userData.friendsList = allUsers[existingUserIndex].friendsList || [];
        allUsers[existingUserIndex] = userData;
    } else {
        allUsers.push(userData);
    }

    localStorage.setItem("allUsers", JSON.stringify(allUsers));
}

// Обробка реферального коду
function processReferral(referralCode, newUserId) {
    let allUsers = JSON.parse(localStorage.getItem("allUsers")) || [];

    const referringUserIndex = allUsers.findIndex(user => user.referralCode === referralCode);

    if (referringUserIndex >= 0) {
        const referringUser = allUsers[referringUserIndex];

        if (!referringUser.friendsList) {
            referringUser.friendsList = [];
        }
        referringUser.friendsList.push(newUserId);

        referringUser.friends += 1;
        referringUser.points += 5;

        allUsers[referringUserIndex] = referringUser;
        localStorage.setItem("allUsers", JSON.stringify(allUsers));

        console.log(`Користувачу ${referringUser.name} додано 5 балів за запрошення.`);
    }
}

// Оновлення рівня і прогрес бару
function updateLevel(points) {
    const userData = JSON.parse(localStorage.getItem("userData"));
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

    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData) {
        showFriendsList(userData.id);
        document.getElementById("referral-link").textContent = `Your referral link: https://t.me/devionsxtest_bot?start=${userData.referralCode}`;
    }
}

// Показ списку друзів
function showFriendsList(userId) {
    const allUsers = JSON.parse(localStorage.getItem("allUsers")) || [];
    const currentUser = allUsers.find(user => user.id === userId);

    if (currentUser && currentUser.friendsList && currentUser.friendsList.length > 0) {
        const friendsList = document.getElementById("friends-list");
        friendsList.innerHTML = '';

        currentUser.friendsList.forEach(friendId => {
            const friend = allUsers.find(user => user.id === friendId);
            if (friend) {
                const friendItem = document.createElement('p');
                friendItem.textContent = `${friend.name} (ID: ${friend.id})`;
                friendsList.appendChild(friendItem);
            }
        });
    } else {
        document.getElementById("friends-list").textContent = "У вас поки немає друзів.";
    }
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
