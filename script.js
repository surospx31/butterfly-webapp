// Ініціалізація Supabase
const supabaseUrl = 'https://xtmtpukdmqjimgycpwtx.supabase.co'; // Замініть на свій URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bXRwdWtkbXFqaW1neWNwd3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2OTIxMDcsImV4cCI6MjA0MjI2ODEwN30.kzcR2cBf-E_jJjMy9WXekp14Q_qYVjwMInPKUCeHICg'; // Вставте свій API ключ
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async function() {
    const userId = '12345';  // Наприклад, отриманий з Telegram WebApp або іншого джерела

    // Зчитуємо користувача з бази даних Supabase
    let user = await getUserFromSupabase(userId);

    if (!user) {
        // Якщо користувач не існує, зберігаємо нові дані
        const newUser = {
            id: userId,
            name: 'John Doe',
            points: 10,
            level: 1,
            referral_code: generateReferralCode(),
            friends: 0
        };
        await saveUserToSupabase(newUser);
    } else {
        console.log('Користувач вже існує', user);
        updateUI(user);  // Оновлюємо інтерфейс користувача з отриманими даними
    }
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

// Збереження нового користувача в Supabase
async function saveUserToSupabase(userData) {
    const { data, error } = await supabase
        .from('users')
        .insert([userData]);

    if (error) {
        console.error('Помилка збереження користувача:', error);
    } else {
        console.log('Користувач успішно збережений:', data);
    }
}

// Зчитування даних користувача з Supabase
async function getUserFromSupabase(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Помилка отримання користувача:', error);
        return null;
    }

    console.log('Отримані дані користувача:', data);
    return data;
}

// Оновлення даних користувача в Supabase
async function updateUserInSupabase(userId, updatedData) {
    const { data, error } = await supabase
        .from('users')
        .update(updatedData)
        .eq('id', userId);

    if (error) {
        console.error('Помилка оновлення даних користувача:', error);
    } else {
        console.log('Дані користувача оновлені:', data);
    }
}

// Оновлення інтерфейсу користувача
function updateUI(userData) {
    document.querySelector(".level").textContent = `${userData.level} LVL`;
    const progressPercentage = (userData.points / ((userData.level) * 5)) * 100;
    document.querySelector(".progress").style.width = `${progressPercentage}%`;
}

// Оновлення рівня і прогрес бару
function updateLevel(points) {
    let requiredPoints = (userData.level) * 5;
    userData.points += points;

    if (userData.points >= requiredPoints) {
        userData.level += 1;
        userData.points = 0;
        requiredPoints = (userData.level) * 5;
    }

    updateUI(userData);
    updateUserInSupabase(userData.id, { points: userData.points, level: userData.level });
}

// Кнопка CLAIM
document.getElementById("claim-button").addEventListener("click", function() {
    updateLevel(10);  // Наприклад, додамо 10 балів
    document.getElementById("main-screen").style.display = "none";
    document.getElementById("interface-screen").style.display = "block";
});
