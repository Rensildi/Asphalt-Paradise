import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [admin, setAdmin] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/admindashboard',  { withCredentials:true });
                setAdmin(response.data.admin);
            } catch (err) {
                navigate('/adminsignin');
            }
        };

        fetchUserData();
    }, [navigate]);

    return (
        <div>
            {admin ? (
                <div>
                    <h2>Weclome, {admin.email}!</h2>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default AdminDashboard;