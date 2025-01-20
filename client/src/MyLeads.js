import React, { useEffect, useState } from "react";
import api from "./utils/api";

const MyLeads = () => {
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const { data } = await api.get("/leads/my");
                setLeads(data);
            } catch (err) {
                console.error(err);
                alert("Ошибка при загрузке данных");
            }
        };

        fetchLeads();
    }, []);

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            await api.put(`/leads/${leadId}/status`, { status: newStatus });
            setLeads((prevLeads) =>
                prevLeads.map((lead) =>
                    lead.id === leadId ? { ...lead, status: newStatus } : lead
                )
            );
        } catch (err) {
            console.error(err);
            alert("Ошибка при обновлении статуса");
        }
    };

    return (
        <div>
            <h2>Leads</h2>
            <table>
                <thead>
                    <tr>
                        {Object.keys(leads[0] || {}).map((key) => (
                            <th key={key}>{key}</th>
                        ))}
                        <th>Статус</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead, index) => (
                        <tr key={index}>
                            {Object.values(lead).map((value, idx) => (
                                <td key={idx}>{value || "—"}</td>
                            ))}
                            <td>
                                <select
                                    value={lead.status || ""}
                                    onChange={(e) =>
                                        handleStatusChange(lead.id, e.target.value)
                                    }
                                >
                                    <option value="" disabled>
                                        Выберите статус
                                    </option>
                                    <option value="Недозвон">Недозвон</option>
                                    <option value="Слив">Слив</option>
                                    <option value="Перезвон">Перезвон</option>
                                    <option value="Взял">Взял</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MyLeads;
