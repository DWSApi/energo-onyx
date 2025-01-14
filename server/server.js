const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
require("dotenv").config();
const path = require("path");

const app = express();
const port = process.env.PORT || 10001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Создаем пул соединений
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "test_db",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Преобразуем pool в Promises API
const db = pool.promise();

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "Нет токена" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Неверный токен" });

        req.user = decoded;
        next();
    });
};

// Middleware для проверки админских прав
const verifyAdmin = (req, res, next) => {
    if (req.user.isAdmin !== 1) {
        return res.status(403).json({ error: "Нет прав администратора" });
    }
    next();
};

// Регистрация пользователя
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (password.length < 8) {
        return res.status(400).json({ error: "Пароль слишком короткий" });
    }

    try {
        const [result] = await db.query("SELECT * FROM Holodka WHERE email = ?", [email]);
        if (result.length > 0) {
            return res.status(400).json({ error: "Пользователь уже существует" });
        }

        await db.query("INSERT INTO Holodka (name, email, password, isAdmin) VALUES (?, ?, ?, 0)", [name, email, password]);
        res.status(201).json({ message: "Пользователь зарегистрирован" });
    } catch (err) {
        console.error("Ошибка БД:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Логин пользователя
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [result] = await db.query("SELECT * FROM Holodka WHERE email = ?", [email]);
        if (result.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const user = result[0];

        if (password !== user.password) {
            return res.status(401).json({ error: "Неверный пароль" });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: "6h" }
        );

        res.status(200).json({ token });
    } catch (err) {
        console.error("Ошибка при обработке запроса:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Получение всех пользователей с их данными об отправках
app.get("/users", authenticateToken, async (req, res) => {
    try {
        const users = await db.query("SELECT * FROM Holodka"); // Запрос всех пользователей
        const userSubmissions = await db.query("SELECT id, count, data FROM Holodka");

        const usersWithSubmissions = users.map(user => {
            const submission = userSubmissions.find(sub => sub.user_id === user.id) || { count: 0, data: '—' };
            return { ...user, submissionCount: submission.count, lastSubmissionDate: submission.data };
        });

        res.json(usersWithSubmissions);
    } catch (err) {
        res.status(500).json({ error: "Ошибка при получении данных пользователей" });
    }
});

// Удаление пользователя
app.delete("/users/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Удаление данных пользователя
        await db.query("DELETE FROM Holodka WHERE id = ?", [id]);
        res.json({ success: true, message: "Пользователь удален" });
    } catch (err) {
        res.status(500).json({ error: "Ошибка при удалении пользователя" });
    }
});

// Обновление данных о счётчике и дате
app.post("/submit-form", authenticateToken, async (req, res) => {
    const { fio, phone, dataroz, region, document, message, purchaseType, accountName, userId } = req.body;

    try {
        const currentDate = new Date().toISOString().split("T")[0]; // Текущая дата

        const [result] = await db.query("SELECT * FROM Holodka WHERE id = ?", [userId]);
        if (result.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const user = result[0];

        if (user.data !== currentDate) {
            // Если дата не совпадает, сбрасываем count до 0
            await db.query(
                "UPDATE Holodka SET count = 0, data = ? WHERE id = ?",
                [currentDate, userId]
            );
        } else {
            // Если дата совпадает, увеличиваем count на 1
            await db.query(
                "UPDATE Holodka SET count = count + 1 WHERE id = ?",
                [userId]
            );
        }

        res.status(200).json({ message: "Данные анкеты успешно залогированы" });
    } catch (err) {
        console.error("Ошибка при логировании анкеты:", err);
        res.status(500).json({ error: "Ошибка сервера при логировании анкеты" });
    }
});


// Получение данных о счётчике и дате для пользователя
app.get("/submission-data/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;

    try {
        const [result] = await db.query("SELECT count, data FROM Holodka WHERE id = ?", [userId]);

        if (result.length === 0) {
            return res.status(404).json({ error: "Данные не найдены для этого пользователя" });
        }

        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Обновление данных о счётчике и дате
app.put("/submission-data/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;
    const { count, date } = req.body;

    try {
        await db.query(
            "INSERT INTO Holodka (id, count, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE count = ?, data = ?",
            [userId, count, date, count, date]
        );

        res.status(200).json({ message: "Данные обновлены" });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Получение информации о пользователе
app.get("/account", authenticateToken, async (req, res) => {
    try {
        const [result] = await db.query("SELECT id, name, email, isAdmin FROM Holodka WHERE id = ?", [req.user.id]);

        if (result.length === 0) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Получение списка пользователей (только админы)
app.get("/admin/users", authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const [result] = await db.query("SELECT id, name, email, isAdmin, count FROM Holodka");
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Удаление пользователя (только админы)
app.delete("/admin/users/:id", authenticateToken, verifyAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM Holodka WHERE id = ?", [req.params.id]);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Обслуживание статических файлов
const clientPath = path.join(__dirname, "..", "client", "build");
app.use(express.static(clientPath));

app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
});

// Обновление данных пользователя
app.put("/users/:id", authenticateToken, async (req, res) => {
    const { name, email } = req.body;
    const userId = req.params.id;

    if (!name || !email) {
        return res.status(400).json({ error: "Недостаточно данных для обновления" });
    }

    try {
        const [result] = await db.query(
            "UPDATE Holodka SET name = ?, email = ? WHERE id = ?",
            [name, email, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        res.status(200).json({ message: "Пользователь обновлен" });
    } catch (err) {
        console.error("Ошибка БД:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на порту ${port}`);
});
