import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser } from "./utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Хук для получения роли
import axios from "axios"; // Добавьте axios, если еще не добавлен

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();

    // Функция для получения данных о пользователе с сервера
    const fetchUserSubmissionData = async (userId) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            return response.data; // Возвращаем данные пользователя, включая count и data
        } catch (err) {
            console.error("Ошибка при загрузке данных пользователя:", err);
            setError("Ошибка при получении данных пользователя.");
            return null;
        }
    };

    // Получение всех пользователей и их данных
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
            navigate("/"); // Переход на главную страницу
            return;
        }

        try {
            const data = await getAllUsers();

            // Загружаем данные о пользователях с сервера, включая данные о количестве отправок
            const usersWithSubmissionData = await Promise.all(
                data.map(async (user) => {
                    const userData = await fetchUserSubmissionData(user.id);
                    return { ...user, submissionCount: userData?.count || 0, lastSubmissionDate: userData?.data || "—" };
                })
            );

            setUsers(usersWithSubmissionData);

            // Считаем общее количество отправок всех пользователей
            const total = usersWithSubmissionData.reduce((sum, user) => sum + user.submissionCount, 0);
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

    // Удаление пользователя
    const handleDeleteUser = async (id) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Токен не найден");
            return;
        }

        try {
            const data = await deleteUser(id);
            if (data.success) {
                fetchUsers(); // Повторно загружаем список пользователей
            } else {
                setError(data.message || "Не удалось удалить пользователя.");
            }
        } catch (error) {
            setError("Ошибка удаления пользователя.");
            console.error("Ошибка при удалении пользователя:", error);
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
