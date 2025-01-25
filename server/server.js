const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
require("dotenv").config();
const path = require("path");
const multer = require("multer");
const XLSX = require("xlsx");
const { use } = require("react");

const app = express();
const port = process.env.PORT || 10001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Логируем переменные окружения для отладки
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);

console.log(process.env);


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
    if ((req.user.isAdmin !== 1 && req.user.isAdmin !== 2)) {
        return res.status(403).json({ error: "Нет прав администратора" });
    }
    next();
};

// Конфигурация загрузки файлов
const upload = multer({ dest: "uploads/" });

// Загрузка лидов из Excel
app.post("/leads/upload", authenticateToken, verifyAdmin, upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: "Файл не найден" });

        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Обработка данных с учетом новых колонок
        const leads = data.map((row) => [
            row["ФИО"], // fio
            row["Номер"], // phone
            row["Почта"] || null, // email
            row["Дата рождения (MM/DD/YYYY)"] || null, // birthdate
            row["Оператор"] || null, // operator
            row["Регион"] || null, // region
        ]);

        // Добавление данных в таблицу leads
        const [result] = await db.query(
            "INSERT INTO leads (fio, phone, email, birthdate, operator, region) VALUES ?",
            [leads]
        );

        res.status(201).json({ message: "Лиды успешно загружены", inserted: result.affectedRows });
    } catch (err) {
        console.error("Ошибка загрузки лидов:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


// Получение списка лидов
app.get("/leads", authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const [leads] = await db.query("SELECT * FROM leads");
        res.status(200).json(leads);
    } catch (err) {
        console.error("Ошибка получения лидов:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Назначение лида пользователю
app.post("/leads/assign", authenticateToken, verifyAdmin, async (req, res) => {
    const { leadId, userId } = req.body;
    try {
        const [result] = await db.query(
            "UPDATE leads SET assigned_to = ? WHERE id = ?",
            [userId, leadId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Лид или пользователь не найден" });
        }

        res.status(200).json({ message: "Лид успешно назначен пользователю" });
    } catch (err) {
        console.error("Ошибка назначения лида:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Получение лидов для текущего пользователя
app.get("/leads/my", authenticateToken, async (req, res) => {
    try {
        const [leads] = await db.query("SELECT * FROM leads WHERE assigned_to = ?", [req.user.id]);
        res.status(200).json(leads);
    } catch (err) {
        console.error("Ошибка получения личных лидов:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Обновление статуса лида
app.put("/leads/:id/status", authenticateToken, async (req, res) => {
    try {
        const leadId = req.params.id;
        const { status } = req.body;

        // Проверка валидности статуса
        const validStatuses = ["Недозвон", "Слив", "Перезвон", "Взял"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Неверный статус" });
        }

        // Обновление статуса в БД
        const [result] = await db.query(
            "UPDATE leads SET status = ? WHERE id = ? AND assigned_to = ?",
            [status, leadId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Лид не найден или не принадлежит пользователю" });
        }

        res.status(200).json({ message: "Статус успешно обновлен" });
    } catch (err) {
        console.error("Ошибка обновления статуса лида:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


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
    console.log("📩 Получен запрос на логин с данными:");
    console.log("Email:", email); // Логируем email пользователя
    console.log("Пароль (не безопасно, но для отладки можно скрыть):", password ? "*****" : "Нет пароля"); // Логируем пароль (важно скрыть в продакшн)

    try {
        // Проверка на существование пользователя в БД
        const [result] = await db.query("SELECT * FROM Holodka WHERE email = ?", [email]);
        if (result.length === 0) {
            console.warn("⚠ Пользователь с таким email не найден:", email); // Логируем предупреждение, если пользователя нет
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const user = result[0];
        
        // Проверка пароля
        if (password !== user.password) {
            console.warn("⚠ Неверный пароль для пользователя:", email); // Логируем, если пароль неверный
            return res.status(401).json({ error: "Неверный пароль" });
        }

        console.log("✅ Успешный логин для пользователя:", email); // Логируем успешный вход

        // Создание токена JWT
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: "6h" }
        );

        res.status(200).json({ token });
    } catch (err) {
        console.error("❌ Ошибка при обработке запроса:", err); // Логируем ошибку при обработке запроса
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


app.post("/submit-form", authenticateToken, async (req, res) => {
    const { fio, phone, dataroz, region, document, message, nameBaza, accountName } = req.body;

    // Логирование данных
    console.log("📋 Получена анкета:");
    console.log("ФИО:", fio);
    console.log("Телефон:", phone);
    console.log("Дата рождения:", dataroz);
    console.log("Регион:", region);
    console.log("Документ:", document);
    console.log("Сообщение:", message);
    console.log("База:", nameBaza);
    console.log("Имя пользователя из аккаунта:", accountName);

    // Получаем текущую дату
    const currentDate = new Date().toISOString().split("T")[0]; // Формат YYYY-MM-DD

    // Получаем ID пользователя из токена
    const userId = req.user.id;

    try {
        // Обновляем или добавляем данные в таблицу Holodka для конкретного пользователя
        const [result] = await db.query(
            
            `
            INSERT INTO Holodka (id, count, data)
            VALUES (?, 1, ?)
            ON DUPLICATE KEY UPDATE
                count = CASE
                    WHEN data = ? THEN count + 1
                    ELSE 1
                END,
                data = ?
                `
            ,
            [userId, currentDate, currentDate, currentDate]
        );

        // Сохраняем данные в новую таблицу (например, new_table)
        const [newTableResult] = await db.query(
            
            `
            INSERT INTO leads (user_id, fio, phone, dataroz, region, document, message, nameBaza, submission_date, assigned_to, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
            `
            ,
            [userId, fio, phone, dataroz, region, document, message, nameBaza, currentDate]
        );

        // Обновляем total_count в таблице, независимо от пользователя
        await db.query(
            
            
            `INSERT INTO total_submissions (id, total_count)
            VALUES (1, 1)
            ON DUPLICATE KEY UPDATE
                total_count = total_count + 1
            `

        );

        if (result.affectedRows === 0 || newTableResult.affectedRows === 0) {
            return res.status(500).json({ error: "Ошибка при добавлении данных в базу" });
        }

        console.log("✅ Данные успешно добавлены в базу данных и в новую таблицу");

        res.status(200).json({ message: "Данные анкеты успешно залогированы" });
    } catch (err) {
        console.error("Ошибка при логировании анкеты:", err);
        res.status(500).json({ error: "Ошибка сервера при логировании анкеты" });
    }
});


// Получение информации о пользователе
app.get("/account", authenticateToken, async (req, res) => {
    console.log("✅ Декодированный токен:", req.user);

    try {
        // Получаем данные пользователя из таблицы Holodka
        const [result] = await db.query("SELECT id, name, email, isAdmin, count, data FROM Holodka WHERE id = ?", [req.user.id]);

        if (result.length === 0) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        // Получаем общий счетчик total_count из таблицы Holodka_Global
        const [globalResult] = await db.query("SELECT total_count FROM total_submissions LIMIT 1");

        if (globalResult.length === 0) {
            return res.status(404).json({ message: "Не удалось найти общий счетчик" });
        }

        // Возвращаем данные пользователя и общий счетчик
        const response = {
            ...result[0],
            total_count: globalResult[0].total_count
        };

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


// Получение списка пользователей (только админы)
app.get("/admin/users", authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const [result] = await db.query("SELECT id, name, email, isAdmin, count, data FROM Holodka");
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

    // Проверка, что обновляются правильные данные
    if (!name || !email) {
        return res.status(400).json({ error: "Недостаточно данных для обновления" });
    }

    try {
        // Обновляем пользователя в базе данных
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

// Обнуление количества отправок для всех пользователей
app.put("/admin/reset-submissions", authenticateToken, verifyAdmin, async (req, res) => {
    try {
        await db.query("UPDATE Holodka SET count = 0");
        res.status(200).json({ message: "Количество отправок обнулено для всех пользователей." });
    } catch (err) {
        console.error("Ошибка при обнулении отправок:", err);
        res.status(500).json({ error: "Ошибка сервера при обнулении отправок" });
    }
});


// Установка текущей даты для всех пользователей
app.put("/admin/set-today", authenticateToken, verifyAdmin, async (req, res) => {
    const today = new Date().toISOString().split("T")[0]; // Формат YYYY-MM-DD
    try {
        await db.query("UPDATE Holodka SET data = ?", [today]);
        res.status(200).json({ message: "Текущая дата установлена для всех пользователей." });
    } catch (err) {
        console.error("Ошибка при установке даты:", err);
        res.status(500).json({ error: "Ошибка сервера при установке даты" });
    }
});


// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на порту ${port}`);
});