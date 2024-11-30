const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
const port = 5000;

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to the database!');
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // React front-end
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true in production with https
}));

// Sign-up route
app.post('/signup', async (req, res) => {
    const { firstname, lastname, address, email, phonenumber, cardholder, expirationdate, cardnumber, cvv, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (firstName, lastName, address, email, phoneNumber, cardHolder, expirationDate, cardNumber, cvv, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [firstname, lastname, address, email, phonenumber, cardholder, expirationdate, cardnumber, cvv, hashedPassword], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Email already exists' });
            }
            return res.status(500).json({ message: 'Error signing up user' });
        }
        req.session.user = { id: result.insertId, firstname, email }; // Save session data
        return res.status(201).json({ message: 'Sign-up successful' });
    });
});

// Sign-in route
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, result) => {
        if (err || !result.length) return res.status(401).json({ message: 'User not found' });

        const user = result[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

        req.session.user = { id: user.id, firstname: user.firstname, email: user.email }; // Save session
        return res.json({ message: 'Sign-in successful', user: req.session.user });
    });
});

// Dashboard route (requires authentication)
app.get('/userdashboard', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });

    res.json({ message: 'Welcome to the dashboard', user: req.session.user });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Error during logout' });
        res.json({ message: 'Logged out successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
