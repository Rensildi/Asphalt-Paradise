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

  const query = `
    SELECT 
      qr.*, 
      u.firstName AS client_firstName, 
      u.lastName AS client_lastName, 
      u.email AS client_email
    FROM quote_requests qr
    JOIN users u ON qr.client_id = u.userid
    WHERE qr.status = "Pending" OR qr.status = "Negotiating"
  `;

  db.query(query, (err, result) => {
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

// Get specific bill details by ID
app.get('/bills/:billId', (req, res) => {
  const { billId } = req.params;

  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  const query = `
    SELECT 
      b.bill_id, 
      b.order_id, 
      b.amount, 
      b.status, 
      b.note, 
      b.payment_date, 
      b.created_at, 
      b.updated_at, 
      b.due_date,
      u.firstname AS client_firstName, 
      u.lastname AS client_lastName, 
      u.email AS client_email
    FROM bills b
    JOIN users u ON b.client_id = u.userid
    WHERE b.bill_id = ?
  `;

  db.query(query, [billId], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Failed to fetch bill details.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    res.json(result[0]);
  });
});


// Create a new bill
// Create a new bill
app.post('/bills', (req, res) => {
  const { quote_id, amount } = req.body;

  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  if (!quote_id || !amount) {
    return res.status(400).json({ message: 'Quote ID and amount are required.' });
  }

  // Fetch the order_id and client_id using the quote_id
  const fetchOrderQuery = 'SELECT order_id, client_id FROM orders WHERE quote_request_id = ?';

  db.query(fetchOrderQuery, [quote_id], (err, results) => {
    if (err) {
      console.error('Error fetching order details:', err);
      return res.status(500).json({ message: 'Failed to fetch order details.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Order not found for the given quote ID.' });
    }

    const { order_id, client_id } = results[0]; // Extract order_id and client_id
    console.log('Fetched Order ID:', order_id, 'Client ID:', client_id);

    // Insert a new bill using the fetched order_id and client_id
    const insertBillQuery = `
      INSERT INTO bills (order_id, client_id, amount, status, created_at)
      VALUES (?, ?, ?, 'Pending', NOW())
    `;

    db.query(insertBillQuery, [order_id, client_id, amount], (err, result) => {
      if (err) {
        console.error('Error inserting bill:', err);
        return res.status(500).json({ message: 'Failed to create bill.' });
      }

      console.log('Bill created with ID:', result.insertId);
      res.status(201).json({
        message: 'Bill created successfully.',
        billId: result.insertId
      });
    });
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
    status = 'Pending'; // Keep as "Pending" for CounterOffer
  } else {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const updateQuoteQuery = 'UPDATE quote_requests SET status = ?, updated_at = NOW() WHERE quote_request_id = ?';

  db.query(updateQuoteQuery, [status, quoteId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error', errorDetails: err });
    }

    if (action === 'Accept') {
      // Fetch the client_id for the quote
      const fetchClientQuery = 'SELECT client_id FROM quote_requests WHERE quote_request_id = ?';
      db.query(fetchClientQuery, [quoteId], (err, result) => {
        if (err || result.length === 0) {
          return res.status(500).json({ message: 'Failed to fetch client for the quote.' });
        }
    
        const clientId = result[0].client_id;
    
        // Insert into orders table
        const insertOrderQuery = `
          INSERT INTO orders (quote_request_id, client_id, status, created_at, updated_at)
          VALUES (?, ?, 'In Progress', NOW(), NOW())
        `;
        db.query(insertOrderQuery, [quoteId, clientId], (err, orderResult) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to create order.', errorDetails: err });
          }
          console.log('Order creation response:', orderResult);
          console.log('Client ID:', clientId);

          if (!orderResult.insertId || !clientId) {
            return res.status(500).json({ message: 'Order creation failed. Missing orderId or clientId.' });
          }
    
          // Return the new order_id and client_id to the frontend
          res.status(200).json({
            message: 'Quote accepted and order created successfully.',
            orderId: orderResult.insertId, // Return the generated order_id
            clientId: clientId            // Return the client_id for bill creation
          });
        });
      });
    } else if (action === 'CounterOffer') {
      const insertResponseQuery = `
        INSERT INTO quote_responses (quote_request_id, admin_id, counter_price, time_window, note)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(insertResponseQuery, [quoteId, req.session.adminId, counter_price, time_window, note], (err, responseResult) => {
        if (err) {
          return res.status(500).json({ message: 'Database query error', errorDetails: err });
        }

        res.status(200).json({ message: 'CounterOffer submitted successfully.' });
      });
    } else {
      res.status(200).json({ message: 'Response submitted successfully.' });
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

  // Determine the sender: Admin or User
  const adminId = req.session.adminId;
  const userId = req.session.userId;

  if (!adminId && !userId) {
    return res.status(401).json({ message: 'User or Admin not authenticated' });
  }

  if (!message) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  const senderRole = adminId ? 'admin' : 'user';
  const negotiationData = {
    quote_request_id: quoteRequestId,
    message,
    status: 'Negotiating',
    sender_role: senderRole, // Track sender role (admin or user)
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
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

      res.status(201).json(results[0]); // Return the newly created message
    });
  });
});


// Fetch all bills for the logged-in user
app.get('/user/bills', (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const query = `
    SELECT 
      b.bill_id, 
      b.order_id, 
      b.amount, 
      b.status, 
      b.note, 
      b.payment_date, 
      b.created_at, 
      b.updated_at
    FROM bills b
    JOIN orders o ON b.order_id = o.order_id
    WHERE o.client_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Failed to fetch bills.' });
    }

    res.json(results);
  });
});

// Update bill status based on user action (Accept/Reject)
app.post('/user/bills/:billId/respond', (req, res) => {
  const { billId } = req.params;
  const { action } = req.body;

  if (!req.session.userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (action !== 'Accept' && action !== 'Reject') {
    return res.status(400).json({ message: 'Invalid action.' });
  }

  const status = action === 'Accept' ? 'Paid' : 'Disputed';

  const query = 'UPDATE bills SET status = ?, updated_at = NOW() WHERE bill_id = ?';
  db.query(query, [status, billId], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Failed to update bill status.' });
    }

    res.status(200).json({ message: `Bill ${action.toLowerCase()}ed successfully. `});
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

///////////////////////// Requirements of Project ///////////////////////////
// Big Clients
app.get('/big-clients', (req, res) => {
  console.log("Received request at /big-clients");
  console.log('Request received at /big-clients');
  console.log('Request headers:', req.headers);
  console.log('Request query:', req.query);
  console.log('Request cookies:', req.cookies);
  console.log('Session data for /big-clients:', req.session);
  try {
    db.query(`
      SELECT u.userid AS client_id, u.firstName AS client_firstName, u.lastName AS client_lastName, COUNT(o.order_id) AS order_count
      FROM orders o
      JOIN users u ON o.client_id = u.userid
      WHERE o.status = 'Completed'
      GROUP BY o.client_id
      ORDER BY order_count DESC
      LIMIT 1;
    `, (err, result) => {
      if (err) {
        console.error("Database query error: ", err);  // Log the detailed error to the server console
        return res.status(500).send({ error: "Internal Server Error. Please try again later." });
      }
      if (result.length === 0) {
        return res.json([])  // Handle no results case
      }
      res.json(result);
    });
  } catch (err) {
    console.error('Error in /big-clients route:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// Difficult Clients
app.get('/difficult-clients', (req, res) => {
  console.log("Received request at /difficult-clients");

  const difficultClientsQuery = `
    SELECT u.userid AS client_id,
           u.firstName AS client_firstName,
           u.lastName AS client_lastName,
           COUNT(q.quote_request_id) AS total_unresolved_quotes
    FROM users u
    JOIN quote_requests q ON q.client_id = u.userid
    LEFT JOIN quote_responses qr ON q.quote_request_id = qr.quote_request_id
    WHERE q.status IN ('Pending', 'Negotiating')
      AND qr.quote_request_id IS NULL -- Ensures no admin response exists
    GROUP BY u.userid
    HAVING COUNT(q.quote_request_id) >= 3; -- Clients with at least 3 unresolved quotes
  `;

  db.query(difficultClientsQuery, (err, result) => {
    if (err) {
      console.error('Error fetching difficult clients:', err);
      return res.status(500).json({ message: "Error fetching difficult clients.", errorDetails: err });
    }

    console.log("Difficult clients query result:", result);

    if (result.length === 0) {
      console.log("No difficult clients found.");
      return res.status(200).json([]); // Return an empty array if no results are found
    }

    res.status(200).json(result);
  });
});






// This Month's Quotes
app.get('/this-month-quotes', (req, res) => {
  console.log("Received request at /this-month-quotes");

  const thisMonthQuotesQuery = `
      SELECT q.*
      FROM quote_requests q
      WHERE q.status = 'Accepted' AND DATE_FORMAT(q.created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m');
  `;

  db.query(thisMonthQuotesQuery, (err, result) => {
      if (err) {
          console.error('Error fetching this month\'s quotes:', err);
          return res.status(500).send("Error fetching this month's quotes.");
      }

      if (result.length === 0) {
          return res.status(200).json([]); // Return an empty array if no results are found
      }

      res.json(result);
  });
});



// Prospective clients
app.get('/prospective-clients', (req, res) => {
  console.log("Received request at /prospective-clients");
  db.query(`
    SELECT u.userid AS client_id, u.firstName AS client_firstName, u.lastName AS client_lastName 
    FROM users u
    LEFT JOIN quote_requests q ON u.userid = q.client_id
    WHERE q.quote_request_id IS NULL;
  `, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching prospective clients.");
    }
    res.json(result);
  });
});



// Largest Driveway
app.get('/largest-driveway', (req, res) => {
  console.log("Received request at /largest-driveway");

  const largestDrivewayQuery = `
      SELECT qr.property_address, qr.square_feet
      FROM quote_requests qr
      JOIN bills b ON qr.client_id = b.client_id
      WHERE b.status = 'Paid'
      ORDER BY qr.square_feet DESC
      LIMIT 1;
  `;

  db.query(largestDrivewayQuery, (err, result) => {
      if (err) {
          console.error('Error fetching largest driveway:', err);
          return res.status(500).send("Error fetching largest driveway.");
      }

      if (result.length === 0) {
          return res.status(404).json({ message: 'No driveway data found with Paid bills.' });
      }

      res.json(result[0]);
  });
});



// Overdue Bills
app.get('/overdue-bills', (req, res) => {
  console.log("Received request at /overdue-bills");
  db.query(`
    SELECT b.bill_id, b.amount, b.status, b.payment_date, o.order_id
    FROM bills b
    JOIN orders o ON b.order_id = o.order_id
    WHERE b.status = 'Pending' AND b.payment_date IS NULL AND b.created_at < NOW() - INTERVAL 7 DAY;
  `, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching overdue bills.");
    }
    res.json(result);
  });
});



// Bad Clients
app.get('/bad-clients', (req, res) => {
  console.log("Received request at /bad-clients");
  db.query(`
    SELECT u.userid AS client_id, u.firstName AS client_firstName, u.lastName AS client_lastName
    FROM users u
    JOIN bills b ON u.userid = b.client_id
    WHERE b.payment_date IS NULL 
      AND b.created_at < NOW() - INTERVAL 7 DAY
    GROUP BY u.userid
    HAVING COUNT(b.bill_id) > 0 
       AND SUM(CASE WHEN b.payment_date IS NOT NULL THEN 1 ELSE 0 END) = 0;
  `, (err, result) => {
    if (err) {
      console.error('Error fetching bad clients:', err);
      return res.status(500).send("Error fetching bad clients.");
    }
    console.log("Bad Clients Result: ", result); // <--- LOG THE RESPONSE
    res.json(result);
  });
});



// Good Clients
app.get('/good-clients', (req, res) => {
  console.log("Received request at /good-clients");
  db.query(`
    SELECT DISTINCT u.userid AS client_id, u.firstName AS client_firstName, u.lastName AS client_lastName
    FROM users u
    JOIN bills b ON u.userid = b.client_id
    WHERE b.payment_date IS NOT NULL 
      AND TIMESTAMPDIFF(HOUR, b.created_at, b.payment_date) <= 24;
  `, (err, result) => {
    if (err) {
      console.error('Error fetching good clients:', err);
      return res.status(500).send("Error fetching good clients.");
    }
    res.json(result);
  });
});

app._router.stack.forEach((middleware) => {
  if (middleware.route) {
      console.log('Registered route:', middleware.route.path);
  }
});

app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  next();
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});