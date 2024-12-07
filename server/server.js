const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
const port = 5000;

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asphalt_paradise',
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.message);
        throw err;
    }
    console.log('Connected to the database!');
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true,
}));
app.use(express.json());
app.use(session({
    key: 'user_sid',
    secret: process.env.SESSION_SECRET || 'user_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 },
}));

// Admin Session
app.use('/admin', session({
    key: 'admin_sid',
    secret: process.env.ADMIN_SESSION_SECRET || 'admin_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 },
}));

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (!req.session.admin) {
        return res.status(403).json({ message: 'Forbidden: Admins only.' });
    }
    next();
};

// ------------------------- Routes -------------------------

// User Sign-up Route
app.post('/signup', async (req, res) => {
    const { firstname, lastname, address, email, phonenumber, cardholder, expirationdate, cardnumber, cvv, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (firstName, lastName, address, email, phoneNumber, cardHolder, expirationDate, cardNumber, cvv, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(query, [firstname, lastname, address, email, phonenumber, cardholder, expirationdate, cardnumber, cvv, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email already exists' });
                }
                return res.status(500).json({ message: 'Error signing up user' });
            }
            req.session.user = { id: result.insertId, firstname, email };
            return res.status(201).json({ message: 'Sign-up successful' });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// User Sign-in Route
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, result) => {
        if (err || !result.length) {
            console.error('Sign-in failed:', err || 'User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.error('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = { id: user.userid, firstname: user.firstName, email: user.email };
        res.json({ message: 'Sign-in successful', user: req.session.user });
    });
});

// Admin Sign-in Route
app.post('/adminsignin', async (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM admin WHERE username = ?';
    db.query(query, [username], async (err, result) => {
        if (err || result.length === 0) {
            console.error('Admin sign-in failed:', err || 'Admin not found');
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const admin = result[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            console.error('Invalid password for admin:', username);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        req.session.admin = { adminid: admin.adminid, username: admin.username, email: admin.email };
        console.log('Admin signed in successfully:', req.session.admin);
        res.json({ message: 'Sign-in successful', admin: req.session.admin });
    });
});

// User Dashboard Route
app.get('/userdashboard', isAuthenticated, (req, res) => {
    res.json({ user: req.session.user });
});

// Admin Dashboard Route
app.get('/admindashboard', isAdmin, (req, res) => {
    res.json({ admin: req.session.admin });
});

// Fetch Quotes for a User
app.get('/quotes', isAuthenticated, (req, res) => {
    const clientId = req.session.user.id;
    const query = `
        SELECT * FROM quote_requests 
        WHERE client_id = ? 
        ORDER BY created_at DESC
    `;
    db.query(query, [clientId], (err, results) => {
        if (err) {
            console.error('Error fetching quotes:', err);
            return res.status(500).json({ message: 'Failed to load quotes.' });
        }
        res.json(results);
    });
});

// Submit a Quote
app.post('/quotes', isAuthenticated, (req, res) => {
    const { property_address, square_feet, proposed_price, note } = req.body;
    const clientId = req.session.user.id;

    const query = `
        INSERT INTO quote_requests (client_id, property_address, square_feet, proposed_price, note, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
    `;
    db.query(query, [clientId, property_address, square_feet, proposed_price, note || ''], (err, result) => {
        if (err) {
            console.error('Error creating quote:', err);
            return res.status(500).json({ message: 'Failed to create quote.' });
        }
        res.status(201).json({ message: 'Quote created successfully', quoteId: result.insertId });
    });
});

// Fetch Pending Quotes for Admin
app.get('/quotes/pending', isAdmin, (req, res) => {
    const query = `
        SELECT qr.*, u.firstName AS client_firstName, u.lastName AS client_lastName, u.email AS client_email
        FROM quote_requests qr
        JOIN users u ON qr.client_id = u.userid
        WHERE qr.status = 'Pending'
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching pending quotes:', err);
            return res.status(500).json({ message: 'Failed to fetch pending quotes.' });
        }
        res.json(results);
    });
});

// Admin Response to a Quote
app.post('/respond-quote/:quoteId', isAdmin, (req, res) => {
    const { quoteId } = req.params;
    const { action, counterPrice, timeWindow, note } = req.body;
    const adminId = req.session.admin.adminid;

    // Determine status based on action
    let status = '';
    if (action === 'Accept') {
        status = 'Accepted';
    } else if (action === 'Reject') {
        status = 'Rejected';
    } else if (action === 'CounterOffer') {
        status = 'Counter-Proposal';
    } else {
        return res.status(400).json({ message: 'Invalid action specified.' });
    }

    // Insert or update the quote_responses table
    const query1 = `
        INSERT INTO quote_responses (quote_request_id, admin_id, counter_price, time_window, note, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        counter_price = VALUES(counter_price),
        time_window = VALUES(time_window),
        note = VALUES(note),
        status = VALUES(status),
        updated_at = NOW()
    `;

    db.query(query1, [quoteId, adminId, counterPrice || null, timeWindow || null, note || null, status], (err, result) => {
        if (err) {
            console.error('Error inserting/updating quote response:', err);
            return res.status(500).json({ message: 'Failed to process the response!' });
        }

        // Update the status of the related quote_request
        const query2 = `
            UPDATE quote_requests
            SET status = ?, updated_at = NOW()
            WHERE quote_request_id = ?
        `;
        db.query(query2, [status, quoteId], (err2) => {
            if (err2) {
                console.error('Error updating quote request status:', err2);
                return res.status(500).json({ message: 'Failed to update quote request status.' });
            }

            res.json({ message: 'Quote response submitted successfully.' });
        });
    });
});

// Start the Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
