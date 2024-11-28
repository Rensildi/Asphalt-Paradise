import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';

function SignUp() {
    const [values, setValues] = useState({
        firstname: '',
        lastname: '',
        email: '',
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

        // Validate password and confirm password match
        if (values.password !== values.confirmpassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(values.password, 10);
            
            // Send the signup request excluding the 'confirmpassword' field
            const response = await axios.post('/signup', {
                firstname: values.firstname,
                lastname: values.lastname,
                email: values.email,
                address: values.address,
                cardholder: values.cardholder,
                cardnumber: values.cardnumber,
                expirationdate: values.expirationdate,
                cvv: values.cvv,
                password: hashedPassword
            });
            
            console.log(response);
            navigate('/signin');
        } catch (err) {
            console.error(err);
            alert("Signup failed. Please try again.");
        }
    }

    return (
        <div>
            <div className='row'>
                <h3>Sign Up</h3>
                <div>
                    <Link to='/signin' className='btn btn-success'>Sign In</Link>
                    <p>Already have an account?</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor='firstname'>First Name</label>
                        <input type='text' name='firstname' required onChange={(e) => setValues({ ...values, firstname: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='lastname'>Last Name</label>
                        <input type='text' name='lastname' required onChange={(e) => setValues({ ...values, lastname: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='email'>Email</label>
                        <input type='email' name='email' required onChange={(e) => setValues({ ...values, email: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='address'>Address</label>
                        <input type='text' name='address' required onChange={(e) => setValues({ ...values, address: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='cardholder'>Card Holder</label>
                        <input type='text' name='cardholder' required onChange={(e) => setValues({ ...values, cardholder: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='cardnumber'>Card Number</label>
                        <input type='text' name='cardnumber' pattern="\d*" maxLength="16" required onChange={(e) => setValues({ ...values, cardnumber: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='expirationdate'>Expiration Date</label>
                        <input type='text' name='expirationdate' pattern="\d{2}/\d{2}" placeholder="MM/YY" required onChange={(e) => setValues({ ...values, expirationdate: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='cvv'>CVV</label>
                        <input type='text' name='cvv' pattern="\d{3,4}" maxLength="4" required onChange={(e) => setValues({ ...values, cvv: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='password'>Password</label>
                        <input type='password' name='password' required onChange={(e) => setValues({ ...values, password: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor='confirmpassword'>Confirm Password</label>
                        <input type='password' name='confirmpassword' required onChange={(e) => setValues({ ...values, confirmpassword: e.target.value })} />
                    </div>
                    <div className='form-group my-3'>
                        <button type='submit' className='btn btn-success'>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUp;
