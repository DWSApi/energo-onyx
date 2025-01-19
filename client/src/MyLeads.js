import React, { useEffect, useState } from "react";
import api from "../services/api";

const MyLeads = () => {
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const response = await api.get("/leads/my");
                setLeads(response.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLeads();
    }, []);

    return (
        <div>
            <h2>Мои лиды</h2>
            <ul>
                {leads.map((lead) => (
                    <li key={lead.id}>
                        {lead.fio} - {lead.phone} - {lead.additional_info}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MyLeads;
