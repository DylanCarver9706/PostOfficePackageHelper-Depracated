const express = require('express');
const app = express();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Middleware to parse JSON request bodies
app.use(express.json());

// Create the MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',         // Replace with your MySQL host
  user: 'root',              // Replace with your MySQL username
  password: 'admin',         // Replace with your MySQL password
  database: 'PostOfficePackageHelperV1.1',  // Replace with your MySQL database name
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Define a route to handle user registration
app.post('/api/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user's information into the database
    const sql = 'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [first_name, last_name, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ error: 'An error occurred while registering the user.' });
      }
      console.log('User registered successfully');
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'An error occurred while registering the user.' });
  }
});

// Define other routes and middleware as needed

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
