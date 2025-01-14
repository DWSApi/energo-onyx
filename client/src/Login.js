import React, { useState } from "react";
import { login } from './utils/api';
import { useNavigate } from 'react-router-dom';
import jwtDecode from "jwt-decode"; // Декодируем JWT токен
import { useAuth } from "./AuthContext"; // Используем контекст авторизации

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { updateAuthState } = useAuth(); // Функция для обновления состояния авторизации

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");  // Сбрасываем ошибку

        try {
            const response = await login(email, password);
            if (response.token) {
                const decodedToken = jwtDecode(response.token); // Декодируем токен
                const isAdmin = decodedToken.isAdmin || false;

                // Запросим данные пользователя с сервера, включая дату
                const userDataResponse = await fetch("/account", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${response.token}`,
                    }
                });
                const userData = await userDataResponse.json();

                // Обновляем состояние в контексте с данными пользователя
                updateAuthState(response.token, isAdmin, userData);  // Передаем userData с полем 'data'

                navigate("/"); // Перенаправление после успешного логина
                window.location.reload(); // Перезагружаем страницу для обновления состояния
            } else {
                setError("Не удалось войти. Проверьте введенные данные.");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Ошибка при логине. Пожалуйста, попробуйте снова.");
        }
    };

    return (
        <div className="Login">
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
