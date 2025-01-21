import React, { useEffect, useState } from "react";
import api from "./utils/api";

const LeadsTable = () => {
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

    return (
        <div>
            <h2>Leads</h2>
            <table>
                <thead>
                    <tr>
                        {Object.keys(leads[0] || {}).map((key) => (
                            <th key={key}>{key}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead, index) => (
                        <tr key={index}>
                            {Object.values(lead).map((value, idx) => (
                                <td key={idx}>{value || "—"}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
};

export default LeadsTable;