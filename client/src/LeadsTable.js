import React, { useEffect, useState } from "react";
import api from "./utils/api";

const LeadsTable = () => {
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const { data } = await api.get("/leads");
                setLeads(data);
            } catch (err) {
                console.error(err);
                alert("Ошибка при загрузке данных");
            }
        };

        fetchLeads();
    }, []);

    return (
        <div>
            <h2>Leads</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Телефон</th>
                        <th>Email</th>
                        <th>Дополнительные данные</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr key={lead.id}>
                            <td>{lead.id}</td>
                            <td>{lead.fio}</td>
                            <td>{lead.phone}</td>
                            <td>{lead.email}</td>
                            <td>{lead.extraData ? JSON.stringify(JSON.parse(lead.extraData), null, 2) : "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LeadsTable;
