import React, { useEffect, useState } from "react";
import api from "./utils/api";

const AssignLeads = () => {
    const [leads, setLeads] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedLead, setSelectedLead] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const leadsResponse = await api.get("/leads");
                const usersResponse = await api.get("/admin/users");
                setLeads(leadsResponse.data);
                setUsers(usersResponse.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleAssign = async () => {
        if (!selectedLead || !selectedUser) return alert("Выберите лида и пользователя");

        try {
            const response = await api.post("/leads/assign", {
                leadId: selectedLead,
                userId: selectedUser,
            });
            setMessage(response.data.message);
        } catch (err) {
            console.error(err);
            setMessage("Ошибка назначения лида");
        }
    };

    return (
        <div>
            <h2>Назначение лидов</h2>
            <select onChange={(e) => setSelectedLead(e.target.value)} value={selectedLead}>
                <option value="">Выберите лида</option>
                {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                        {lead.fio} ({lead.phone})
                    </option>
                ))}
            </select>
            <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
                <option value="">Выберите пользователя</option>
                {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                    </option>
                ))}
            </select>
            <button onClick={handleAssign}>Назначить</button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default AssignLeads;