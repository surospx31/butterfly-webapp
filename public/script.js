document.addEventListener("DOMContentLoaded", () => {
    const user = window.Telegram.WebApp.initDataUnsafe.user;

    const butterfly = document.getElementById("butterfly");
    const getButton = document.getElementById("get-button");
    const usernameElement = document.getElementById("username");
    const avatarElement = document.getElementById("user-avatar");

    // Відображаємо аватарку та нікнейм
    usernameElement.innerText = user.username;
    avatarElement.src = user.photo_url || 'default-avatar.png';  // Якщо немає фото, використовуємо стандартну

    // Коли користувач натискає GET
    getButton.addEventListener("click", async () => {
        const userData = {
            id: user.id,
            name: user.username,
            points: 0,
            level: 1,
            referralCode: generateReferralCode(),
            referredBy: null  // Можливо, буде використано для реферальної логіки
        };

        // Надсилаємо дані на сервер
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            getButton.style.display = "none";
            showUserProfile(userData);
        } else {
            console.error('Помилка отримання метелика');
        }
    });

    // Генерація унікального реферального коду
    function generateReferralCode() {
        return 'ref-' + Math.random().toString(36).substr(2, 8);
    }

    // Відображення профілю користувача
    function showUserProfile(userData) {
        document.getElementById("level").innerText = `Level: ${userData.level}`;
        document.getElementById("points").innerText = `Points: ${userData.points}`;
        document.getElementById("referral-link").innerText = `Ваше реферальне посилання: ${userData.referralCode}`;
    }

    // Обробка меню
    document.getElementById("home-btn").addEventListener("click", () => {
        // Повернення до екрану з метеликом
        showUserProfile({
            name: user.username,
            level: 1, // Початковий рівень
            points: 0 // Початкові поінти
        });
    });

    document.getElementById("friends-btn").addEventListener("click", () => {
        alert("Ваше реферальне посилання: " + generateReferralCode());
        // Реалізуй відображення друзів через API
    });

    document.getElementById("tasks-btn").addEventListener("click", () => {
        alert("Tasks coming soon...");
        // Тут реалізуй логіку завдань
    });

    document.getElementById("market-btn").addEventListener("click", () => {
        alert("Market coming soon... Ton Connect will be added");
        // Реалізуй Ton Connect
    });
});
