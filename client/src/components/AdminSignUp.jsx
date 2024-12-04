import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminSignUp = () => {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/adminsignup', {username, email, password}, { withCredentials: true});
            if (response.status === 201) {
                navigate('/adminsignin');
            }
        } catch (err) {
            if (err.response?.status === 409) {
                setError('Username or email already exists');
            } else {
                setError(err.response?.data?.message || 'An error occurred');
            }
        }        
    };

    return (
        <div>
            <h2>Admin Sign Up</h2>
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type='submit'>Sign Up</button>
            </form>
        </div>
    );
};

export default AdminSignUp