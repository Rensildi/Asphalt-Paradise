const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const moment = require('moment');
const path = require('path');
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', } // Secure should be true in production with HTTPS
}));

// Admin Signup Route
app.post('/adminsignup', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if username or email already exists
  const checkQuery = 'SELECT * FROM admin WHERE username = ? OR email = ?';
  db.query(checkQuery, [username, email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: 'Error hashing password' });
      }

      // Insert the new admin into the database
      const insertQuery = 'INSERT INTO admin (username, email, password) VALUES (?, ?, ?)';
      db.query(insertQuery, [username, email, hashedPassword], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json({ message: 'Admin created successfully' });
      });
    });
  });
});



// Admin Sign In Route
app.post('/adminsignin', async (req, res) => {
  const { username, password } = req.body;

  // Check if the username exists in the database
  const query = 'SELECT * FROM admin WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no user found
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare the provided password with the hashed password from the database
    const admin = results[0];  // Since usernames are unique, there will be at most 1 result
    bcrypt.compare(password, admin.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Error comparing passwords' });
      }

      // If passwords don't match
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Password matched, create a session
      req.session.adminId = admin.adminid;
      req.session.username = admin.username;
      req.session.email = admin.email;
      req.session.loggedIn = true;

      // Optionally, update the last login timestamp
      const updateLoginQuery = 'UPDATE admin SET last_login = NOW() WHERE adminid = ?';
      db.query(updateLoginQuery, [admin.adminid], (err, result) => {
        if (err) {
          console.error('Error updating last login:', err);
        }
      });

      // Respond with success
      res.status(200).json({ message: 'Login successful', adminId: admin.adminid, username: admin.username });
    });
  });
});


app.get('/admindashboard', (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  db.query('SELECT * FROM admin WHERE adminid = ?', [req.session.adminId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', errorDetails: err });
    }
    res.json({ user: result[0] });
  });
});

// Get all pending quotes
app.get('/quotes/pending', (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  db.query('SELECT * FROM quote_requests WHERE status = "Pending"', (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', errorDetails: err });
    }
    res.json(result);
  });
});

// Get all orders
app.get('/orders', (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  db.query('SELECT * FROM orders', (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', errorDetails: err });
    }
    res.json(result);
  });
});

// Get all bills
app.get('/bills', (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  db.query('SELECT * FROM bills', (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', errorDetails: err });
    }
    res.json(result);
  });
});

// Respond to a quote (Accept, Reject, CounterOffer)
app.post('/respond-quote/:quoteId', (req, res) => {
  const { quoteId } = req.params;
  const { action, counter_price, time_window, note } = req.body;

  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  let status = '';
  if (action === 'Accept') {
    status = 'Accepted';
  } else if (action === 'Reject') {
    status = 'Rejected';
  } else if (action === 'CounterOffer') {
    status = 'Negotiating';
  } else {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const query = 'UPDATE quote_requests SET status = ?, updated_at = NOW() WHERE quote_request_id = ?';
  db.query(query, [status, quoteId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', errorDetails: err });
    }

    // Insert the quote response (counter offer or note)
    if (action === 'CounterOffer') {
      const insertQuery = 'INSERT INTO quote_responses (quote_request_id, admin_id, counter_price, time_window, note) VALUES (?, ?, ?, ?, ?)';
      db.query(insertQuery, [quoteId, req.session.adminId, counter_price, time_window, note], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Database query error', errorDetails: err });
        }
        res.status(200).json({ message: 'Quote response submitted successfully' });
      });
    } else {
      res.status(200).json({ message: 'Quote response submitted successfully' });
    }
  });
});

// Pay a bill
app.post('/bills/:billId/pay', (req, res) => {
  const { billId } = req.params;

  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  const query = 'UPDATE bills SET status = "Paid", payment_date = NOW() WHERE bill_id = ?';
  db.query(query, [billId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', errorDetails: err });
    }
    res.status(200).json({ message: 'Bill marked as paid successfully' });
  });
});
/////////////////// USER ROUTES ////////////////////////////

// Sign Up route
app.post('/signup', (req, res) => {
  const { firstname, lastname, address, email, phonenumber, cardholder, expirationdate, cardnumber, cvv, password } = req.body;

  // Check if all required fields are provided
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  // Check if the email already exists in the database
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error, please try again' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password before storing it in the database
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ message: 'Error hashing password' });
      }

      // Insert the new user into the database
      const query = `
        INSERT INTO users (firstName, lastName, address, phoneNumber, email, cardHolder, expirationDate, cardNumber, cvv, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(query, [firstname, lastname, address, phonenumber, email, cardholder, expirationdate, cardnumber, cvv, hashedPassword], (err, results) => {
        if (err) {
          console.error('Error inserting user:', err);
          return res.status(500).json({ message: 'Error saving user to database' });
        }

        return res.status(201).json({ message: 'User created successfully' });
      });
    });
  });
});


// Sign In route
app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Find the user by email
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error, please try again' });
    }

    // Check if user exists
    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the stored hashed password
    bcrypt.compare(password, results[0].password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Error comparing passwords' });
      }

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // If passwords match, start a session for the user
      req.session.userId = results[0].userid;
      req.session.email = results[0].email;

      // Respond with a success message
      return res.status(200).json({ message: 'Sign-in successful', userId: results[0].userid });
    });
  });
});

// User Dashboard: Fetch user data
app.get('/userdashboard', (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  db.query('SELECT * FROM users WHERE userid = ?', [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to fetch user data' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: results[0] });
  });
});

// Quote Requests: Fetch all quote requests for the logged-in user
app.get('/quote_requests', (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  db.query('SELECT * FROM quote_requests WHERE client_id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to fetch quote requests' });
    }

    res.json(results);
  });
});

// Quote Responses: Fetch all quote responses for a specific quote request
app.get('/quote_responses/:quoteRequestId', (req, res) => {
  const quoteRequestId = req.params.quoteRequestId;

  db.query('SELECT * FROM quote_responses WHERE quote_request_id = ?', [quoteRequestId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to fetch quote responses' });
    }

    res.json(results);
  });
});

// Negotiation Logs: Fetch all negotiation messages for a specific quote request
app.get('/negotiation_logs/:quoteRequestId', (req, res) => {
  const quoteRequestId = req.params.quoteRequestId;

  db.query('SELECT * FROM negotiation_logs WHERE quote_request_id = ?', [quoteRequestId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to fetch negotiation logs' });
    }

    res.json(results);
  });
});

// Send Negotiation Message: Create a new negotiation log for a quote request
app.post('/negotiation_logs/:quoteRequestId', (req, res) => {
  const { quoteRequestId } = req.params;
  const { message } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!message) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  db.query('SELECT * FROM quote_requests WHERE quote_request_id = ?', [quoteRequestId], (err, results) => {
    if (err) {
      console.error('Error fetching quote request:', err);
      return res.status(500).json({ message: 'Error fetching quote request' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Quote request not found' });
    }

    const negotiationData = {
      quote_request_id: quoteRequestId,
      bill_id: null, // Assuming you will handle this based on business logic
      message,
      status: 'Negotiating',
      created_at: moment().format('YYYY-MM-DD HH:mm:ss')
    };

    db.query('INSERT INTO negotiation_logs SET ?', [negotiationData], (err, results) => {
      if (err) {
        console.error('Error inserting negotiation log:', err);
        return res.status(500).json({ message: 'Failed to send negotiation message' });
      }

      // Fetch the newly created negotiation log and return it
      db.query('SELECT * FROM negotiation_logs WHERE negotiation_id = ?', [results.insertId], (err, results) => {
        if (err) {
          console.error('Error fetching negotiation log:', err);
          return res.status(500).json({ message: 'Error fetching the negotiation log' });
        }

        res.status(201).json(results[0]);
      });
    });
  });
});

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  
  }
});

// Set file filter and limits (optional)
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  
}).array('files', 5);  

// Route to handle the form submission (with files)
app.post('/submit-quote', upload, (req, res) => {
  const { propertyAddress, squareFeet, proposedPrice, note, client_id } = req.body;
  const files = req.files;

  if (!propertyAddress || !squareFeet || !client_id) {
    return res.status(400).json({ error: 'All required fields must be provided.' });
  }

  // Optionally save file paths to the database
  const filePaths = files ? files.map(file => file.path) : [];

  const query = 'INSERT INTO quote_requests (client_id, property_address, square_feet, proposed_price, note, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
  
  db.query(query, [client_id, propertyAddress, squareFeet, proposedPrice, note], (err, result) => {
    if (err) {
      console.error('Error inserting quote request:', err);
      return res.status(500).json({ error: 'Error submitting quote request. Please try again.' });
    }

    // Optionally link files to the quote request in another table
    const quoteRequestId = result.insertId;
    if (filePaths.length > 0) {
      const insertFilesQuery = 'INSERT INTO quote_files (quote_request_id, file_path) VALUES ?';
      const fileData = filePaths.map(filePath => [quoteRequestId, filePath]);
      db.query(insertFilesQuery, [fileData], (err, fileResult) => {
        if (err) {
          console.error('Error inserting files:', err);
        }
      });
    }

    res.json({ message: 'Quote request submitted successfully', quoteRequestId });
  });
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
