import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LeadsTable = () => {
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchLeads = async () => {
            const { data } = await axios.get('http://localhost:5000/api/leads');
            setLeads(data);
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
                            <td>{lead.name}</td>
                            <td>{lead.phone}</td>
                            <td>{lead.email}</td>
                            <td>{lead.extraData ? JSON.stringify(JSON.parse(lead.extraData), null, 2) : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LeadsTable;
