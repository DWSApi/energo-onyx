import React, { useState } from "react";
import api from "./utils/api";

const UploadLeads = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return alert("Выберите файл");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post("/leads/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMessage(response.data.message);
        } catch (err) {
            console.error(err);
            setMessage("Ошибка загрузки файла");
        }
    };

    return (
        <div>
            <h2>Загрузка лидов</h2>
            <input type="file" accept=".xlsx" onChange={handleFileChange} />
            <button onClick={handleUpload}>Загрузить</button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default UploadLeads;