import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCreditCard, FaLock } from 'react-icons/fa';
import { MdDateRange } from 'react-icons/md';
import '../styles/SignUp.css';

function SignUp() {
    const [values, setValues] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phonenumber: '',
        address: '',
        cardholder: '',
        cardnumber: '',
        expirationdate: '',
        cvv: '',
        password: '',
        confirmpassword: ''
    });

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (values.password !== values.confirmpassword) {
            alert("Passwords do not match");
            return;
        }
        try {
            const hashedPassword = await bcrypt.hash(values.password, 10);
            await axios.post('http://localhost:5000/signup', {
                ...values,
                password: hashedPassword
            });
            navigate('/signin');
        } catch (err) {
            console.error(err.response?.data || err.message);
        }
    }

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2 className="signup-title">Create Your Account</h2>
                <form onSubmit={handleSubmit}>
                    {/* Grouped fields for first name and last name */}
                    <div className="form-row">
                        <div className="form-group">
                            <label><FaUser /> First Name</label>
                            <input type="text" required onChange={(e) => setValues({ ...values, firstname: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label><FaUser /> Last Name</label>
                            <input type="text" required onChange={(e) => setValues({ ...values, lastname: e.target.value })} />
                        </div>
                    </div>

                    {/* Grouped fields for email and phone */}
                    <div className="form-row">
                        <div className="form-group">
                            <label><FaEnvelope /> Email</label>
                            <input type="email" required onChange={(e) => setValues({ ...values, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label><FaPhone /> Phone</label>
                            <input type="text" pattern="\d{10}" maxLength={20} required onChange={(e) => setValues({ ...values, phonenumber: e.target.value })} />
                        </div>
                    </div>

                    {/* Single column for address */}
                    <div className="form-group">
                        <label><FaMapMarkerAlt /> Address</label>
                        <input type="text" required onChange={(e) => setValues({ ...values, address: e.target.value })} />
                    </div>

                    {/* Single column for card holder */}
                    <div className="form-group">
                        <label><FaUser /> Card Holder</label>
                        <input type="text" required onChange={(e) => setValues({ ...values, cardholder: e.target.value })} />
                    </div>

                    {/* Grouped fields for card number and expiration date */}
                    <div className="form-row">
                        <div className="form-group">
                            <label><FaCreditCard /> Card Number</label>
                            <input type="text" pattern="\d*" maxLength="16" required onChange={(e) => setValues({ ...values, cardnumber: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label><MdDateRange /> Expiration Date</label>
                            <input type="text" pattern="\d{2}/\d{2}" placeholder="MM/YY" required onChange={(e) => setValues({ ...values, expirationdate: e.target.value })} />
                        </div>
                    </div>

                    {/* Single column for CVV */}
                    <div className="form-group">
                        <label><FaLock /> CVV</label>
                        <input type="text" pattern="\d{3,4}" maxLength="4" required onChange={(e) => setValues({ ...values, cvv: e.target.value })} />
                    </div>

                    {/* Single column for password and confirm password */}
                    <div className="form-row">
                        <div className="form-group">
                            <label><FaLock /> Password</label>
                            <input type="password" required onChange={(e) => setValues({ ...values, password: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label><FaLock /> Confirm Password</label>
                            <input type="password" required onChange={(e) => setValues({ ...values, confirmpassword: e.target.value })} />
                        </div>
                    </div>

                    <button type="submit" className="btn-submit">Sign Up</button>
                </form>
                <p className="redirect-text">
                    Already have an account? <Link to="/signin">Sign In</Link>
                </p>
            </div>
        </div>
    );
}

export default SignUp;
