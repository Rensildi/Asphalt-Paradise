import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/userdashboard', { withCredentials: true });
                setUser(response.data.user);
            } catch (err) {
                navigate('/signin');
            }
        };

        fetchUserData();
    }, [navigate]);

    return (
        <div>
            {user ? (
                <div>
                    <h2>Welcome, {user.firstname}!</h2>
                    <p>Email: {user.email}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default UserDashboard;
