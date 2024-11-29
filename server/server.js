const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const path = require("path");
const app = express();
//path.resolve()
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ 
  origin: "http://localhost:3000",
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
 }));
app.use(express.json());

const port = 5000;
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "asphalt_paradise",
});

// SignUp
app.post("/signup", async (req, res) => {
  console.log('Received request:', req.body);  // Debug request payload
  const sql = "INSERT INTO users (firstName, lastName, email, phoneNumber, address, cardHolder, cardNumber, expirationDate, cvv, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [req.body.firstname, req.body.lastname, req.body.email, req.body.phonenumber, req.body.address, req.body.cardholder, req.body.cardnumber, req.body.expirationdate, req.body.cvv, req.body.password];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB Insert Error:', err);
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: "User added successfully" });
  });
});


// SignIn
app.post("/signin", async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await db.query('SELECT * FROM users WHERE email ?', [email]);

    if (result.length > 0) {
      const user = result[0];

      const validPassword = await bcrypt.compare(password, user.password)
      if (validPassword) {
        res.status(200).json({message: 'Sign-In successful', user});
      } else {
        res.status(401).json({message: 'Invalid email or password'});
      }
    } else {
      res.status(404).json({ message: 'User not found'});
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
});


// Dashboard
app.post("/dashboard", async (req, rest) => {

})



// app.post("/add_user", (req, res) => {
//   const sql =
//     "INSERT INTO student_details (`name`,`email`,`age`,`gender`) VALUES (?, ?, ?, ?)";
//   const values = [req.body.name, req.body.email, req.body.age, req.body.gender];
//   db.query(sql, values, (err, result) => {
//     if (err)
//       return res.json({ message: "Something unexpected has occured" + err });
//     return res.json({ success: "Student added successfully" });
//   });
// });

app.get("/students", (req, res) => {
  const sql = "SELECT * FROM student_details";
  db.query(sql, (err, result) => {
    if (err) res.json({ message: "Server error" });
    return res.json(result);
  });
});

app.get("/get_student/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM student_details WHERE `id`= ?";
  db.query(sql, [id], (err, result) => {
    if (err) res.json({ message: "Server error" });
    return res.json(result);
  });
});

app.post("/edit_user/:id", (req, res) => {
  const id = req.params.id;
  const sql =
    "UPDATE student_details SET `name`=?, `email`=?, `age`=?, `gender`=? WHERE id=?";
  const values = [
    req.body.name,
    req.body.email,
    req.body.age,
    req.body.gender,
    id,
  ];
  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({ message: "Something unexpected has occured" + err });
    return res.json({ success: "Student updated successfully" });
  });
});

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM student_details WHERE id=?";
  const values = [id];
  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({ message: "Something unexpected has occured" + err });
    return res.json({ success: "Student updated successfully" });
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port} `);
});
