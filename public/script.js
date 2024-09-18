document.addEventListener("DOMContentLoaded", () => {
    const user = window.Telegram.WebApp.initDataUnsafe.user || { username: 'guest', id: null };

    const initialPage = document.getElementById("initial-page");
    const mainPage = document.getElementById("main-page");
    const getButton = document.getElementById("get-button");
    const usernameElement = document.getElementById("username");
    const avatarElement = document.getElementById("user-avatar");

    usernameElement.innerText = user.username;
    avatarElement.src = user.photo_url || 'default-avatar.png';

    // Додано лог для перевірки чи дані користувача коректні
    console.log('User data:', user);

    checkIfUserGotButterfly();

    getButton.addEventListener("click", async () => {
        // Лог для перевірки, чи спрацьовує клік на кнопку
        console.log('GET button clicked');

        const userData = {
            id: user.id || Date.now(), // fallback ID if user.id is not available
            name: user.username || 'guest',
            points: 0,
            level: 1,
            referralCode: generateReferralCode(),
            referredBy: null
        };

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            // Лог результату запиту
            console.log('Response from /api/users:', response);

            if (response.ok) {
                initialPage.style.display = "none";
                mainPage.style.display = "block";
                showUserProfile(userData);
            } else {
                console.error('Error getting the butterfly');
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    });

    function generateReferralCode() {
        return 'ref-' + Math.random().toString(36).substr(2, 8);
    }

    function showUserProfile(userData) {
        document.getElementById("level").innerText = `Level: ${userData.level}`;
        document.getElementById("points").innerText = `Points: ${userData.points}`;
        document.getElementById("referral-link").innerText = `Your referral link: ${userData.referralCode}`;
    }

    async function checkIfUserGotButterfly() {
        try {
            const response = await fetch(`/api/users/${user.id}`);
            console.log('Response from /api/users/:id:', response);

            if (response.ok) {
                const userData = await response.json();
                if (userData.gotButterfly) {
                    initialPage.style.display = "none";
                    mainPage.style.display = "block";
                    showUserProfile(userData);
                }
            } else {
                console.error('Error loading user data');
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    document.getElementById("home-btn").addEventListener("click", () => {
        showUserProfile({
            name: user.username || 'guest',
            level: 1,
            points: 0
        });
    });

    document.getElementById("friends-btn").addEventListener("click", () => {
        alert("Your referral link: " + generateReferralCode());
    });

    document.getElementById("tasks-btn").addEventListener("click", () => {
        alert("Tasks coming soon...");
    });

    document.getElementById("market-btn").addEventListener("click", () => {
        alert("Market coming soon...");
    });
});
