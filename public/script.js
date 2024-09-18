document.addEventListener("DOMContentLoaded", () => {
    const user = window.Telegram.WebApp.initDataUnsafe.user;

    const initialPage = document.getElementById("initial-page");
    const mainPage = document.getElementById("main-page");
    const getButton = document.getElementById("get-button");
    const usernameElement = document.getElementById("username");
    const avatarElement = document.getElementById("user-avatar");

    // Display the user's username and avatar
    usernameElement.innerText = user.username;
    avatarElement.src = user.photo_url || 'default-avatar.png'; // Fallback to a default avatar

    // Check if the user has already received the butterfly
    checkIfUserGotButterfly();

    // When the user clicks the GET button
    getButton.addEventListener("click", async () => {
        const userData = {
            id: user.id,
            name: user.username,
            points: 0,
            level: 1,
            referralCode: generateReferralCode(),
            referredBy: null  // For referral logic later
        };

        // Send the data to the server
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            // After clicking GET, hide the initial page and show the main page
            initialPage.style.display = "none";
            mainPage.style.display = "block";
            showUserProfile(userData);
        } else {
            console.error('Error getting the butterfly');
        }
    });

    // Generate a unique referral code
    function generateReferralCode() {
        return 'ref-' + Math.random().toString(36).substr(2, 8);
    }

    // Show the user's profile information
    function showUserProfile(userData) {
        document.getElementById("level").innerText = `Level: ${userData.level}`;
        document.getElementById("points").innerText = `Points: ${userData.points}`;
        document.getElementById("referral-link").innerText = `Your referral link: ${userData.referralCode}`;
    }

    // Check if the user already got the butterfly
    async function checkIfUserGotButterfly() {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
            const userData = await response.json();
            if (userData.gotButterfly) {
                // If the user has already received the butterfly, show the main page directly
                initialPage.style.display = "none";
                mainPage.style.display = "block";
                showUserProfile(userData);
            }
        } else {
            console.error('Error loading user data');
        }
    }

    // Menu button handlers
    document.getElementById("home-btn").addEventListener("click", () => {
        showUserProfile({
            name: user.username,
            level: 1, // Starting level
            points: 0 // Starting points
        });
    });

    document.getElementById("friends-btn").addEventListener("click", () => {
        alert("Your referral link: " + generateReferralCode());
    });

    document.getElementById("tasks-btn").addEventListener("click", () => {
        alert("Tasks coming soon...");
    });

    document.getElementById("market-btn").addEventListener("click", () => {
        alert("Market coming soon... Ton Connect will be added");
    });
});
