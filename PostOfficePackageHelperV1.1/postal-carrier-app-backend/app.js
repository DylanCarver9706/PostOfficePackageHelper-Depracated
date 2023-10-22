const express = require("express");
const app = express();
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require('express-session');

// Use the cors middleware
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Database        ************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Create the MySQL database connection
const db = mysql.createConnection({
  host: "localhost", // Replace with your MySQL host
  user: "root", // Replace with your MySQL username
  password: "Dtc+Kem2016", // Replace with your MySQL password
  database: "PostOfficePackageHelperV1.2", // Replace with your MySQL database name
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Auth        ****************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

app.use(
  session({
    secret: 'Dtc+Kem2016', // Replace with a secret key
    resave: false,
    saveUninitialized: false,
  })
);

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Query the database to get the hashed password for the provided email
  const sql = 'SELECT password FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'An error occurred' });
    }

    if (results.length === 0) {
      // User not found
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const hashedPassword = results[0].password;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (passwordMatch) {
      // Passwords match, set user data in the session
      req.session.user = { email };
      res.status(200).json({ message: 'Login successful' });
    } else {
      // Passwords do not match
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

// Define a route to check user authentication status
app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    // User is authenticated, send back user data
    res.status(200).json({ isAuthenticated: true, user: req.session.user });
  } else {
    // User is not authenticated
    res.status(401).json({ isAuthenticated: false });
  }
});

// Logout route
app.get('/api/logout', (req, res) => {
  // Destroy the user's session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'An error occurred' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});


// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Users        ***************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

app.post("/api/users/new", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user's information into the database
    const sql =
      "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
    db.query(
      sql,
      [first_name, last_name, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error("Error registering user:", err);
          return res
            .status(500)
            .json({ error: "An error occurred while registering the user." });
        }
        console.log("User registered successfully");
        res.status(201).json({ message: "User registered successfully" });
      }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while registering the user." });
  }
});

// ******************************************************************************************************************
app.get("/api/users", (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error retrieving users:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving users." });
    }
    res.status(200).json(results);
  });
});

// ******************************************************************************************************************
app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT * FROM users WHERE user_id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error retrieving user by ID:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving the user." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(results[0]);
  });
});

// ******************************************************************************************************************
app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const {
    first_name,
    last_name,
    email,
    phone_number,
    home_post_office,
    position,
    password,
  } = req.body;

  // Hash the password here before saving it to the database
  // ...

  const sql =
    "UPDATE users SET first_name=?, last_name=?, email=?, phone_number=?, home_post_office=?, position=?, password=? WHERE user_id=?";
  db.query(
    sql,
    [
      first_name,
      last_name,
      email,
      phone_number,
      home_post_office,
      position,
      password,
      userId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating user:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while updating the user." });
      }
      res.status(200).json({ message: "User updated successfully" });
    }
  );
});

// ******************************************************************************************************************
app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM users WHERE user_id=?";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while deleting the user." });
    }
    res.status(200).json({ message: "User deleted successfully" });
  });
});

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Offices        *************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Create a new office
app.post("/api/offices", (req, res) => {
  // Extract office data from the request body
  const { city, state, phone_number } = req.body;

  // Insert the office data into the database
  const sql =
    "INSERT INTO offices (city, state, phone_number) VALUES (?, ?, ?)";
  db.query(sql, [city, state, phone_number], (err, result) => {
    if (err) {
      console.error("Error creating office:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while creating the office." });
    }
    console.log("Office created successfully");
    res.status(201).json({ message: "Office created successfully" });
  });
});

// ******************************************************************************************************************
// Get all offices
app.get("/api/offices", (req, res) => {
  const sql = "SELECT * FROM offices";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error retrieving offices:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving offices." });
    }
    res.status(200).json(results);
  });
});

// ******************************************************************************************************************
// Get an office by ID
app.get("/api/offices/:id", (req, res) => {
  const officeId = req.params.id;
  const sql = "SELECT * FROM offices WHERE office_id = ?";
  db.query(sql, [officeId], (err, results) => {
    if (err) {
      console.error("Error retrieving office by ID:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving the office." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Office not found" });
    }
    res.status(200).json(results[0]);
  });
});

// ******************************************************************************************************************
// Update an office by ID
app.put("/api/offices/:id", (req, res) => {
  const officeId = req.params.id;
  const { city, state, phone_number } = req.body;
  const sql =
    "UPDATE offices SET city=?, state=?, phone_number=? WHERE office_id=?";
  db.query(sql, [city, state, phone_number, officeId], (err, result) => {
    if (err) {
      console.error("Error updating office:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while updating the office." });
    }
    res.status(200).json({ message: "Office updated successfully" });
  });
});

// ******************************************************************************************************************
// Delete an office by ID
app.delete("/api/offices/:id", (req, res) => {
  const officeId = req.params.id;
  const sql = "DELETE FROM offices WHERE office_id=?";
  db.query(sql, [officeId], (err, result) => {
    if (err) {
      console.error("Error deleting office:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while deleting the office." });
    }
    res.status(200).json({ message: "Office deleted successfully" });
  });
});

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Routes        **************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Create a new route
app.post("/api/routes", (req, res) => {
  // Extract route data from the request body
  const { route_number, office_id } = req.body;

  // Insert the route data into the database
  const sql = "INSERT INTO routes (route_number, office_id) VALUES (?, ?)";
  db.query(sql, [route_number, office_id], (err, result) => {
    if (err) {
      console.error("Error creating route:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while creating the route." });
    }
    console.log("Route created successfully");
    res.status(201).json({ message: "Route created successfully" });
  });
});

// Get all routes
app.get("/api/routes", (req, res) => {
  const sql = "SELECT * FROM routes";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error retrieving routes:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving routes." });
    }
    res.status(200).json(results);
  });
});

// Get a route by ID
app.get("/api/routes/:id", (req, res) => {
  const routeId = req.params.id;
  const sql = "SELECT * FROM routes WHERE route_id = ?";
  db.query(sql, [routeId], (err, results) => {
    if (err) {
      console.error("Error retrieving route by ID:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving the route." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.status(200).json(results[0]);
  });
});

// Update a route by ID
app.put("/api/routes/:id", (req, res) => {
  const routeId = req.params.id;
  const { route_number, office_id } = req.body;
  const sql = "UPDATE routes SET route_number=?, office_id=? WHERE route_id=?";
  db.query(sql, [route_number, office_id, routeId], (err, result) => {
    if (err) {
      console.error("Error updating route:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while updating the route." });
    }
    res.status(200).json({ message: "Route updated successfully" });
  });
});

// Delete a route by ID
app.delete("/api/routes/:id", (req, res) => {
  const routeId = req.params.id;
  const sql = "DELETE FROM routes WHERE route_id=?";
  db.query(sql, [routeId], (err, result) => {
    if (err) {
      console.error("Error deleting route:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while deleting the route." });
    }
    res.status(200).json({ message: "Route deleted successfully" });
  });
});

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Addresses        ***********************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Create a new address
app.post("/api/addresses", (req, res) => {
  // Extract address data from the request body
  const {
    case_number,
    case_row_number,
    address_number,
    address1,
    address2,
    city,
    state,
    zip_code,
    route_id,
  } = req.body;

  // Insert the address data into the database
  const sql = `INSERT INTO addresses (case_number, case_row_number, address_number, address1, address2, city, state, zip_code, route_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      case_number,
      case_row_number,
      address_number,
      address1,
      address2,
      city,
      state,
      zip_code,
      route_id,
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating address:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while creating the address." });
      }
      console.log("Address created successfully");
      res.status(201).json({ message: "Address created successfully" });
    }
  );
});

// Get all addresses
app.get("/api/addresses", (req, res) => {
  const sql = "SELECT * FROM addresses";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error retrieving addresses:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving addresses." });
    }
    res.status(200).json(results);
  });
});

// Get an address by ID
app.get("/api/addresses/:id", (req, res) => {
  const addressId = req.params.id;
  const sql = "SELECT * FROM addresses WHERE address_id = ?";
  db.query(sql, [addressId], (err, results) => {
    if (err) {
      console.error("Error retrieving address by ID:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving the address." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Address not found" });
    }
    res.status(200).json(results[0]);
  });
});

// Update an address by ID
app.put("/api/addresses/:id", (req, res) => {
  const addressId = req.params.id;
  const {
    case_number,
    case_row_number,
    address_number,
    address1,
    address2,
    city,
    state,
    zip_code,
    route_id,
  } = req.body;
  const sql = `UPDATE addresses SET case_number=?, case_row_number=?, address_number=?, address1=?, address2=?, city=?, state=?, zip_code=?, route_id=? WHERE address_id=?`;
  db.query(
    sql,
    [
      case_number,
      case_row_number,
      address_number,
      address1,
      address2,
      city,
      state,
      zip_code,
      route_id,
      addressId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating address:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while updating the address." });
      }
      res.status(200).json({ message: "Address updated successfully" });
    }
  );
});

// Delete an address by ID
app.delete("/api/addresses/:id", (req, res) => {
  const addressId = req.params.id;
  const sql = "DELETE FROM addresses WHERE address_id=?";
  db.query(sql, [addressId], (err, result) => {
    if (err) {
      console.error("Error deleting address:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while deleting the address." });
    }
    res.status(200).json({ message: "Address deleted successfully" });
  });
});

// Define other routes and middleware as needed

const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
