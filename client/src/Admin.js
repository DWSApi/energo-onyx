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
        setSelectedUser(user);
        setIsModalOpen(true); // Открываем модальное окно
    };

    const handleSaveChanges = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Токен не найден");
            return;
        }

        try {
            const updatedUser = await updateUser(selectedUser.id, selectedUser, token);
            setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user));
            setIsModalOpen(false); // Закрываем модальное окно
        } catch (error) {
            setError("Ошибка обновления данных пользователя.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSelectedUser(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="admin-panel">
            <h2>Панель администратора</h2>
            {error && <p className="error">{error}</p>}
            <p>Добро пожаловать, {name}!</p> {/* Добавили приветствие с именем */}
            {users.length > 0 ? (
                <ul className="Admins">
                    {users.map((user) => (
                        <li key={user.id}>
                            <img style={{width: "40px"}} src="https://s6.ezgif.com/tmp/ezgif-6-0978c6aea3.gif" alt="Sticker" /> {user.name} ({user.email})
                            <button className="bntAdm" onClick={() => handleDeleteUser(user.id)}>
                                Удалить
                            </button>
                            <button className="bntAdm" onClick={() => handleEditUser(user)}>
                                Изменить
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                !error && <p>Пользователи не найдены.</p>
            )}

            {/* Модальное окно для редактирования пользователя */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Редактировать пользователя</h3>
                        <label>
                            Имя:
                            <input 
                                type="text" 
                                name="name" 
                                value={selectedUser.name} 
                                onChange={handleChange} 
                            />
                        </label>
                        <label>
                            Email:
                            <input 
                                type="email" 
                                name="email" 
                                value={selectedUser.email} 
                                onChange={handleChange} 
                            />
                        </label>
                        <label>
                            Пароль:
                            <input 
                                type="password" 
                                name="password" 
                                value={selectedUser.password || ""} 
                                onChange={handleChange} 
                            />
                        </label>
                        <label>
                            Роль:
                            <select 
                                name="isAdmin" 
                                value={selectedUser.isAdmin} 
                                onChange={handleChange}
                            >
                                <option value="0">Пользователь</option>
                                <option value="1">Админ</option>
                                <option value="2">Холодка</option>
                            </select>
                        </label>
                        <button className="btn" onClick={handleSaveChanges}>
                            Сохранить
                        </button>
                        <button className="btn" onClick={() => setIsModalOpen(false)}>
                            Отмена
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
