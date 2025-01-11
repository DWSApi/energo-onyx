import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser } from "./utils/api"; 
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "./AuthContext"; // Хук для получения роли

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();  // Получаем роль и имя пользователя

    // Функция для получения данных отправок для каждого пользователя
    const getUserSubmissionData = (userId) => {
        const submissionCountKey = `${userId}_submissionCount`;
        const submissionDateKey = `${userId}_submissionDate`;
        const submissionCount = localStorage.getItem(submissionCountKey) || 0;
        const lastSubmissionDate = localStorage.getItem(submissionDateKey) || "—";
        return { submissionCount, lastSubmissionDate };
    };

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Токен не найден");
                navigate("/login"); 
                return;
            }

            if (role !== "1") { // Если роль не "1", то доступ закрыт
                setError("У вас нет прав для доступа к этой странице.");
                navigate("/"); 
                return;
            }

            try {
                const data = await getAllUsers(token);
                
                // Добавляем информацию о счётчике и дате отправки для каждого пользователя
                const usersWithSubmissionData = data.map(user => {
                    const { submissionCount, lastSubmissionDate } = getUserSubmissionData(user.id);
                    return { ...user, submissionCount, lastSubmissionDate };
                });

                setUsers(usersWithSubmissionData);
            } catch (error) {
                setError("Ошибка подключения к серверу.");
            }
        };

        if (isAuthenticated) { // Проверяем, авторизован ли пользователь
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
                setUsers(prevUsers => prevUsers.filter(user => user.id !== id)); 
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
            <div style={{gap: "20px"}}>
                {users.length > 0 ? (
                    <ul className="Admins">
                        {users.map((user) => (
                            <li key={user.id}>
                                <img style={{width: "40px"}} src="https://s6.ezgif.com/tmp/ezgif-6-0978c6aea3.gif" alt="Sticker" /> {user.name} ({user.email})
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
