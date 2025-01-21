import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser } from "./utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Хук для получения роли

const AdminPanelminus = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();

    const getUserSubmissionData = (userId) => {
        const submissionCountKey = `${userId}_submissionCount`;
        const submissionDateKey = `${userId}_submissionDate`;
        const submissionCount = parseInt(localStorage.getItem(submissionCountKey), 10) || 0;
        const lastSubmissionDate = localStorage.getItem(submissionDateKey) || "—";
        return { submissionCount, lastSubmissionDate };
    };

    const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Токен не найден");
            navigate("/login");
            return;
        }

        // Проверка роли
        if (role !== "2") {
            setError("У вас нет прав для доступа к этой странице.");
            navigate("/");
            return;
        }

        try {
            const data = await getAllUsers();

            // Обновляем пользователей с сервера, добавляя данные о отправках
            const usersWithSubmissionData = data.map(user => {
                const { submissionCount, lastSubmissionDate } = getUserSubmissionData(user.id);
                return { ...user, submissionCount, lastSubmissionDate };
            });
            setUsers(usersWithSubmissionData);

            // Считаем сумму всех отправок
            const total = usersWithSubmissionData.reduce((sum, user) => sum + user.count, 0);
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

    return (
        <div className="admin-panel">
            <h2>Панель Передач</h2>
            {error && <p className="error">{error}</p>}

            {/* Отображение суммы отправок всех пользователей */}
            <p>Общее количество отправок: <strong style={{fontSize:'20px'}}>{totalSubmissions}</strong></p>

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
                                <p style={{color: "green"}}>Отправок за сегодня: <span style={{fontSize:"20px",fontWeight:"bold"}}> {user.count} </span></p>
                                <p>Дата последней отправки:{user.data}</p>
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

export default AdminPanelminus;