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
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ textAlign: "center", color: "#333" }}>Leads</h2>
            <table style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "20px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
            }}>
                <thead>
                    <tr style={{ backgroundColor: "#f4f4f4" }}>
                        {Object.keys(leads[0] || {}).map((key) => (
                            <th
                                key={key}
                                style={{
                                    padding: "10px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                    fontWeight: "bold",
                                    color: "#555",
                                }}
                            >
                                {key}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead, index) => (
                        <tr
                            key={index}
                            style={{
                                backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                                transition: "background-color 0.3s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f1f1")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#fff" : "#f9f9f9")}
                        >
                            {Object.values(lead).map((value, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        padding: "10px",
                                        borderBottom: "1px solid #ddd",
                                        color: "#333",
                                    }}
                                >
                                    {value || "—"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LeadsTable;
