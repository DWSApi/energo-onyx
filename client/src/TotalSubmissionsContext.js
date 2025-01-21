import React, { createContext, useContext, useState, useEffect } from "react";
import { getTotalSubmissions } from "./utils/api"; // Функция API

const TotalSubmissionsContext = createContext();

export const TotalSubmissionsProvider = ({ children }) => {
    const [totalSubmissions, setTotalSubmissions] = useState(0);

    const fetchTotalSubmissions = async () => {
        try {
            const total = await getTotalSubmissions();
            setTotalSubmissions(total);
        } catch (error) {
            console.error("Ошибка при загрузке общего количества передач:", error);
        }
    };

    useEffect(() => {
        fetchTotalSubmissions(); // Загружаем данные при монтировании
    }, []);

    return (
        <TotalSubmissionsContext.Provider value={{ totalSubmissions, setTotalSubmissions }}>
            {children}
        </TotalSubmissionsContext.Provider>
    );
};

export const useTotalSubmissions = () => useContext(TotalSubmissionsContext);
