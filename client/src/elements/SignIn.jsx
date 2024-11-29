import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { FaEnvelop, FaLock} from 'react-icons/fa';
import { MdPassword } from 'react-icons/md';
import '../styles/SignIn.css'


function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('/signin', {email, password});
            if (response.status === 200) {
                console.log(response.data.message);
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message);
            } else {
                console.error(err);
                setError('An unexpected error ocurred');
            }
        }
    };

    return (
        <div className='signin-container'>
            <div className='signin-card'>
                <h2 className='signin-title'>Sign In</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email:
                            <input 
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>
                    </div>
                    <br />
                    <div className="form-group">
                        <label>Password:
                            <input
                                type='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </label>
                    </div>
                    <br />
                    <button type='submit' className='btn-submit'>Sign In</button>
                </form>
                <p className="redirect-text">
                        Create an account! <Link to="/signup">Sign Up</Link>
                </p>
                {error && <p style={{color: 'red'}}>{error}</p>}
            </div>
        </div>
    );
}

export default SignIn;