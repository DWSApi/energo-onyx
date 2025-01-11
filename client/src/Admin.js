import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser } from "./utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();

    // Функция для загрузки пользователей с сервера
    const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Токен не найден");
            navigate("/login");
            return;
        }

        if (role !== "1") {
            setError("У вас нет прав для доступа к этой странице.");
            navigate("/");
            return;
        }

        try {
            const data = await getAllUsers(token);

            // Устанавливаем пользователей и подсчитываем общую сумму отправок
            setUsers(data);
            const total = data.reduce((sum, user) => sum + (user.submissionCount || 0), 0);
            setTotalSubmissions(total);

        } catch (error) {
            setError("Ошибка подключения к серверу.");
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
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Токен не найден");
            return;
        }

        try {
            const data = await deleteUser(id, token);
            if (data.success) {
                // Обновляем пользователей после удаления
                fetchUsers();
            } else {
                setError(data.message || "Не удалось удалить пользователя.");
            }
        } catch (error) {
            setError("Ошибка удаления пользователя.");
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
                                <p>Отправок за сегодня: {user.submissionCount}</p>
                                <p>Дата последней отправки: {user.lastSubmissionDate}</p>
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
        </div>
    );
};

export default AdminPanel;
