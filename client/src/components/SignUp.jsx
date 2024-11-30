import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [phonenumber, setPhoneNumber] = useState('');
    const [cardholder, setCardHolder] = useState('');
    const [expirationdate, setExpirationDate] = useState('');
    const [cardnumber, setCardNumber] = useState('');
    const [cvv, setCvv] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/signup', { firstname, lastname, address, email, phonenumber, cardholder, expirationdate, cardnumber, cvv, password }, { withCredentials: true });
            if (response.status === 201) {
                navigate('/signin');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <div>
            <h2>Sign Up</h2>
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>First Name:</label>
                    <input type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} required />
                </div>
                <div>
                    <label>Last Name:</label>
                    <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} required />
                </div>
                <div>
                    <label>Address:</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label>Phone Number:</label>
                    <input type="tel" value={phonenumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                </div>
                <div>
                    <label>Card Holder:</label>
                    <input type="text" value={cardholder} onChange={(e) => setCardHolder(e.target.value)} required />
                </div>
                <div>
                    <label>Expiration Date:</label>
                    <input type="text" value={expirationdate} onChange={(e) => setExpirationDate(e.target.value)} required />
                </div>
                <div>
                    <label>Card Number:</label>
                    <input type="text" value={cardnumber} onChange={(e) => setCardNumber(e.target.value)} required />
                </div>
                <div>
                    <label>CVV:</label>
                    <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} required />
                </div>
                <div>
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
};

export default SignUp;
