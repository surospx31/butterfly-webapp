document.addEventListener("DOMContentLoaded", () => {
    const user = window.Telegram.WebApp.initDataUnsafe.user;

    const initialPage = document.getElementById("initial-page");
    const mainPage = document.getElementById("main-page");
    const getButton = document.getElementById("get-button");
    const usernameElement = document.getElementById("username");
    const avatarElement = document.getElementById("user-avatar");

    // Відображаємо нікнейм та аватар користувача
    usernameElement.innerText = user.username;
    avatarElement.src = user.photo_url || 'default-avatar.png'; // Якщо немає фото, використовуємо стандартну

    // Перевіряємо, чи отримав користувач метелика
    checkIfUserGotButterfly();

    // Якщо користувач натискає кнопку GET
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
            // Після натискання кнопки GET, приховуємо стартову сторінку та показуємо головну
            initialPage.style.display = "none";
            mainPage.style.display = "block";
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

    // Перевірка чи користувач вже отримав метелика
    async function checkIfUserGotButterfly() {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
            const userData = await response.json();
            if (userData.gotButterfly) {
                // Якщо користувач вже отримав метелика, відразу показуємо головну сторінку
                initialPage.style.display = "none";
                mainPage.style.display = "block";
                showUserProfile(userData);
            }
        } else {
            console.error('Помилка завантаження користувача');
        }
    }

    // Обробка меню
    document.getElementById("home-btn").addEventListener("click", () => {
        showUserProfile({
            name: user.username,
            level: 1, // Початковий рівень
            points: 0 // Початкові поінти
        });
    });

    document.getElementById("friends-btn").addEventListener("click", () => {
        alert("Ваше реферальне посилання: " + generateReferralCode());
    });

    document.getElementById("tasks-btn").addEventListener("click", () => {
        alert("Tasks coming soon...");
    });

    document.getElementById("market-btn").addEventListener("click", () => {
        alert("Market coming soon... Ton Connect will be added");
    });
});
// 1