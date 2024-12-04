import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminSignIn = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/adminsignin', {username, password}, {withCredentials: true});
            if (response.status === 200) {
                console.log('Response:', response.data)
                navigate('/admindashboard');
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Invalid username or password');
            } else if (err.response?.status === 500) {
                setError('Internal server error, please try again later.');
            } else {
                setError('An unexpected error occurred.');
            }
        }               
    };

    return (
        <div>
            <h2>Admin Sign In</h2>
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input type='text' value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div>
                    <label>Passowrd:</label>
                    <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type='submit'>Sign In</button>
            </form>
        </div>
    );
};

export default AdminSignIn