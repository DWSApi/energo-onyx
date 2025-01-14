import { createContext, useContext, useState, useEffect } from "react";

// Контекст для авторизации
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [role, setRole] = useState(null);  // Храним роль пользователя
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState(null);  // Добавляем поле для имени пользователя
    const [data, setData] = useState(null);  // Добавляем поле для хранения данных из 'data'

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role"); // Получаем роль пользователя
        const storedName = localStorage.getItem("name"); // Получаем имя пользователя из localStorage
        const storedData = localStorage.getItem("data"); // Получаем данные (например, дату) из localStorage

        setRole(storedRole);
        setUserName(storedName); // Устанавливаем имя пользователя
        setData(storedData); // Устанавливаем данные из 'data'
        setIsAuthenticated(!!token);
    }, []);

    const decodeToken = (token) => {
        try {
            const base64Url = token.split(".")[1]; // Получаем payload
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const decodedData = JSON.parse(decodeURIComponent(escape(atob(base64)))); // Декодируем корректно
            return decodedData;
        } catch (e) {
            console.error("Ошибка при декодировании токена:", e);
            return {};
        }
    };

    const updateAuthState = (token, role, userData) => {
        const decoded = decodeToken(token); // Декодируем токен
        const name = decoded.name || "Гость"; // Извлекаем имя
        const data = userData.data || null; // Извлекаем поле 'data' из ответа сервера

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("name", name); // Сохраняем имя пользователя
        localStorage.setItem("data", data); // Сохраняем поле 'data'

        setIsAuthenticated(!!token);
        setRole(role);
        setUserName(name);
        setData(data); // Обновляем данные
    };

    return (
        <AuthContext.Provider value={{ role, isAuthenticated, userName, data, updateAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
