document.addEventListener("DOMContentLoaded", async function() {
    const userId = '12345';  // Получите реальный userId из Telegram WebApp или другого источника

    // Получаем пользователя с сервера
    let user = await getUserFromServer(userId);

    if (!user) {
        // Если пользователь не существует, создаём нового
        const newUser = {
            id: userId,
            name: 'John Doe',
            points: 10,
            level: 1,
            referral_code: generateReferralCode(),
            friends: 0
        };
        user = await saveUserToServer(newUser);
    } else {
        console.log('Пользователь уже существует', user);
    }

    updateUI(user);  // Обновляем интерфейс с полученными данными
});

// Генерация уникального реферального кода
function generateReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Получение пользователя с сервера
async function getUserFromServer(userId) {
    try {
        const response = await fetch(`/api/user/${userId}`);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('Ошибка при получении пользователя');
            return null;
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        return null;
    }
}

// Сохранение нового пользователя на сервере
async function saveUserToServer(userData) {
    try {
        const response = await fetch('/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('Ошибка при сохранении пользователя');
            return null;
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        return null;
    }
}

// Обновление данных пользователя на сервере
async function updateUserInServer(userId, updatedData) {
    try {
        const response = await fetch(`/api/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('Ошибка при обновлении пользователя');
            return null;
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        return null;
    }
}

// Обновление интерфейса пользователя
function updateUI(userData) {
    document.querySelector(".level").textContent = `${userData.level} LVL`;
    const progressPercentage = (userData.points / (userData.level * 5)) * 100;
    document.querySelector(".progress").style.width = `${progressPercentage}%`;
}

// Обновление уровня и прогресс-бара
async function updateLevel(points) {
    let requiredPoints = user.level * 5;
    user.points += points;

    if (user.points >= requiredPoints) {
        user.level += 1;
        user.points = 0;
        requiredPoints = user.level * 5;
    }

    updateUI(user);
    await updateUserInServer(user.id, { points: user.points, level: user.level });
}

// Кнопка CLAIM
document.getElementById("claim-button").addEventListener("click", function() {
    updateLevel(10);  // Например, добавляем 10 баллов
    document.getElementById("main-screen").style.display = "none";
    document.getElementById("interface-screen").style.display = "block";
});
