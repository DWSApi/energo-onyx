import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser, updateUser } from "./utils/api"; 
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "./AuthContext"; // Хук для получения роли
import "./App.css";

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // Хранение данных выбранного пользователя
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // Управление модальным окном
    const [showPassword, setShowPassword] = useState(false); // Управление видимостью пароля
    const navigate = useNavigate();
    const { role, isAuthenticated, name } = useAuth();  // Получаем роль и имя пользователя

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
                setUsers(data);
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
    
    const handleEditUser = (user) => {
        console.log("Выбранный пользователь перед установкой:", user);
        setSelectedUser({ ...user, password: user.password || "" }); 
        setIsModalOpen(true);
    };

    const handleSaveChanges = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Токен не найден");
            return;
        }
    
        const updatedUser = { ...selectedUser };
        if (!updatedUser.password || updatedUser.password === selectedUser.password) {
            delete updatedUser.password;
        }
    
        try {
            const updatedData = await updateUser(updatedUser.id, updatedUser, token);
            setUsers(prevUsers => prevUsers.map(user => user.id === updatedData.id ? updatedData : user));
            setIsModalOpen(false); 
        } catch (error) {
            setError("Ошибка обновления данных пользователя.");
        }
    };

    return (
        <div className="admin-panel">
            <h2>Панель администратора</h2>
            {error && <p>{error}</p>}
            <table>
                <thead>
                    <tr>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <button onClick={() => handleEditUser(user)}>Изменить</button>
                                <button onClick={() => handleDeleteUser(user.id)}>Удалить</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Редактировать пользователя</h3>
                        <label>Имя:</label>
                        <input
                            type="text"
                            value={selectedUser.name}
                            onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                        />
                        <label>Email:</label>
                        <input
                            type="email"
                            value={selectedUser.email}
                            onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                        />
                        <label>Пароль:</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={selectedUser.password}
                            onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                        />
                        <button onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "Скрыть" : "Показать"} пароль
                        </button>
                        <button onClick={handleSaveChanges}>Сохранить</button>
                        <button onClick={() => setIsModalOpen(false)}>Закрыть</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
