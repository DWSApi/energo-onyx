import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser, resetSubmissionsAPI, setTodayAPI } from "./utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Хук для получения роли

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();

    const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Токен не найден");
            navigate("/login");
            return;
        }

        // Проверка роли
        if (role !== "1") {
            setError("У вас нет прав для доступа к этой странице.");
            navigate("/");
            return;
        }

        try {
            const data = await getAllUsers();

            // Считаем сумму всех отправок и обновляем пользователей
            const total = data.reduce((sum, user) => sum + user.count, 0);
            setUsers(data);
            setTotalSubmissions(total);
        } catch (error) {
            setError("Ошибка подключения к серверу.");
            console.error("Ошибка при загрузке пользователей:", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchUsers();
        } else {
            setError("Пожалуйста, войдите в систему.");
            navigate("/login");
        }
    }, [role, isAuthenticated, navigate]);

    const handleDeleteUser = async (id) => {
        try {
            const data = await deleteUser(id);
            if (data.success) {
                fetchUsers();
            } else {
                setError(data.message || "Не удалось удалить пользователя.");
            }
        } catch (error) {
            setError("Ошибка удаления пользователя.");
            console.error("Ошибка при удалении пользователя:", error);
        }
    };

    const handleResetSubmissions = async () => {
        try {
            const data = await resetSubmissionsAPI();
            if (data.success) {
                alert("Количество отправок успешно обнулено.");
                fetchUsers();
            } else {
                setError(data.message || "Не удалось обнулить отправки.");
            }
        } catch (error) {
            setError("Ошибка обнуления отправок.");
            console.error("Ошибка при обнулении отправок:", error);
        }
    };

    const handleSetToday = async () => {
        try {
            const data = await setTodayAPI();
            if (data.success) {
                alert("Текущая дата успешно установлена.");
                fetchUsers();
            } else {
                setError(data.message || "Не удалось установить дату.");
            }
        } catch (error) {
            setError("Ошибка установки даты.");
            console.error("Ошибка при установке даты:", error);
        }
    };

    return (
        <div className="admin-panel">
            <h2>Панель администратора</h2>
            {error && <p className="error">{error}</p>}
            <h4>Добро пожаловать!</h4>

            {/* Отображение суммы отправок всех пользователей */}
            <p>Общее количество отправок: <strong>{totalSubmissions}</strong></p>

            <div style={{ gap: "20px" }}>
                {users.length > 0 ? (
                    <ul className="Admins">
                        {users.map((user) => (
                            <li key={user.id}>
                                <img
                                    style={{ width: "40px" }}
                                    src="https://s6.ezgif.com/tmp/ezgif-6-0978c6aea3.gif"
                                    alt="Sticker"
                                />
                                {user.name} ({user.email})
                                <p style={{ color: "green" }}>Отправок за сегодня: <span style={{ fontSize: "20px", fontWeight: "bold" }}>{user.count}</span></p>
                                <p>Дата последней отправки: {user.data || "—"}</p>
                                <button className="bntAdm" onClick={() => handleDeleteUser(user.id)}>
                                    Удалить
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    !error && <p>Пользователи не найдены.</p>
                )}
            </div>

            {/* Добавленные кнопки */}
            <div className="admin-controls" style={{ marginTop: "20px" }}>
                <button className="bntAdm" onClick={handleResetSubmissions}>Обнулить количество отправок</button>
                <button className="bntAdm" onClick={handleSetToday}>Установить сегодняшнюю дату</button>
            </div>
        </div>
    );
};

export default AdminPanel;