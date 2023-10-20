const express = require("express");
const app = express();
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

// Middleware to parse JSON request bodies
app.use(express.json());

// Create the MySQL database connection
const db = mysql.createConnection({
  host: "localhost", // Replace with your MySQL host
  user: "root", // Replace with your MySQL username
  password: "admin", // Replace with your MySQL password
  database: "PostOfficePackageHelperV1.1", // Replace with your MySQL database name
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
app.get('/api/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error retrieving users:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving users.' });
      }
      res.status(200).json(results);
    });
  });
  
// ******************************************************************************************************************
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'SELECT * FROM users WHERE user_id = ?';
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error('Error retrieving user by ID:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving the user.' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(results[0]);
    });
  });
  
// ******************************************************************************************************************
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { first_name, last_name, email, phone_number, home_post_office, position, password } = req.body;
  
    // Hash the password here before saving it to the database
    // ...
  
    const sql = 'UPDATE users SET first_name=?, last_name=?, email=?, phone_number=?, home_post_office=?, position=?, password=? WHERE user_id=?';
    db.query(
      sql,
      [first_name, last_name, email, phone_number, home_post_office, position, password, userId],
      (err, result) => {
        if (err) {
          console.error('Error updating user:', err);
          return res.status(500).json({ error: 'An error occurred while updating the user.' });
        }
        res.status(200).json({ message: 'User updated successfully' });
      }
    );
  });
  
// ******************************************************************************************************************
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'DELETE FROM users WHERE user_id=?';
    db.query(sql, [userId], (err, result) => {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ error: 'An error occurred while deleting the user.' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
    });
  });
  
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Routes        **************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Define a route to create a new route
app.post("/api/routes", (req, res) => {
  // Extract route data from the request body
  const { user_id, route_number } = req.body;

  // Insert the route data into the database
  const sql = "INSERT INTO routes (user_id, route_number) VALUES (?, ?)";
  db.query(sql, [user_id, route_number], (err, result) => {
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

// ******************************************************************************************************************
app.get('/api/routes', (req, res) => {
    const sql = 'SELECT * FROM routes';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error retrieving routes:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving routes.' });
      }
      res.status(200).json(results);
    });
  });
  
// ******************************************************************************************************************
app.get('/api/routes/:id', (req, res) => {
    const routeId = req.params.id;
    const sql = 'SELECT * FROM routes WHERE route_id = ?';
    db.query(sql, [routeId], (err, results) => {
      if (err) {
        console.error('Error retrieving route by ID:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving the route.' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Route not found' });
      }
      res.status(200).json(results[0]);
    });
  });
  
// ******************************************************************************************************************
app.put('/api/routes/:id', (req, res) => {
    const routeId = req.params.id;
    const { user_id, route_number } = req.body;
    const sql = 'UPDATE routes SET user_id=?, route_number=? WHERE route_id=?';
    db.query(
      sql,
      [user_id, route_number, routeId],
      (err, result) => {
        if (err) {
          console.error('Error updating route:', err);
          return res.status(500).json({ error: 'An error occurred while updating the route.' });
        }
        res.status(200).json({ message: 'Route updated successfully' });
      }
    );
  });
  
// ******************************************************************************************************************
app.delete('/api/routes/:id', (req, res) => {
    const routeId = req.params.id;
    const sql = 'DELETE FROM routes WHERE route_id=?';
    db.query(sql, [routeId], (err, result) => {
      if (err) {
        console.error('Error deleting route:', err);
        return res.status(500).json({ error: 'An error occurred while deleting the route.' });
      }
      res.status(200).json({ message: 'Route deleted successfully' });
    });
  });
  
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Cases        ***************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Define a route to create a new case
app.post("/api/cases", (req, res) => {
  // Extract case data from the request body
  const { route_id, case_number } = req.body;

  // Insert the case data into the database
  const sql = "INSERT INTO cases (route_id, case_number) VALUES (?, ?)";
  db.query(sql, [route_id, case_number], (err, result) => {
    if (err) {
      console.error("Error creating case:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while creating the case." });
    }
    console.log("Case created successfully");
    res.status(201).json({ message: "Case created successfully" });
  });
});

// ******************************************************************************************************************
app.get('/api/cases', (req, res) => {
    const sql = 'SELECT * FROM cases';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error retrieving cases:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving cases.' });
      }
      res.status(200).json(results);
    });
  });  
// ******************************************************************************************************************
app.get('/api/cases/:id', (req, res) => {
    const caseId = req.params.id;
    const sql = 'SELECT * FROM cases WHERE case_id = ?';
    db.query(sql, [caseId], (err, results) => {
      if (err) {
        console.error('Error retrieving case by ID:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving the case.' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Case not found' });
      }
      res.status(200).json(results[0]);
    });
  });
  
// ******************************************************************************************************************
app.put('/api/cases/:id', (req, res) => {
    const caseId = req.params.id;
    const { route_id, case_number } = req.body;
    const sql = 'UPDATE cases SET route_id=?, case_number=? WHERE case_id=?';
    db.query(
      sql,
      [route_id, case_number, caseId],
      (err, result) => {
        if (err) {
          console.error('Error updating case:', err);
          return res.status(500).json({ error: 'An error occurred while updating the case.' });
        }
        res.status(200).json({ message: 'Case updated successfully' });
      }
    );
  });
  
// ******************************************************************************************************************
app.delete('/api/cases/:id', (req, res) => {
    const caseId = req.params.id;
    const sql = 'DELETE FROM cases WHERE case_id=?';
    db.query(sql, [caseId], (err, result) => {
      if (err) {
        console.error('Error deleting case:', err);
        return res.status(500).json({ error: 'An error occurred while deleting the case.' });
      }
      res.status(200).json({ message: 'Case deleted successfully' });
    });
  });
  
  
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Case_Rows        ***********************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Define a route to create a new row
app.post("/api/case_rows", (req, res) => {
  // Extract row data from the request body
  const { case_id, case_row_number } = req.body;

  // Insert the row data into the database
  const sql =
    "INSERT INTO `case_rows` (case_id, case_row_number) VALUES (?, ?)";

  db.query(sql, [case_id, case_row_number], (err, result) => {
    if (err) {
      console.error("Error creating case row:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while creating the case row." });
    }
    console.log("Case row created successfully");
    res.status(201).json({ message: "Case row created successfully" });
  });
});

// ******************************************************************************************************************
app.get("/api/case_rows", (req, res) => {
  const sql = "SELECT * FROM case_rows";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error retrieving case rows:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving case rows." });
    }
    res.status(200).json(results);
  });
});

// ******************************************************************************************************************
app.get("/api/case_rows/:id", (req, res) => {
  const caseRowId = req.params.id;
  const sql = "SELECT * FROM case_rows WHERE case_row_id = ?";
  db.query(sql, [caseRowId], (err, results) => {
    if (err) {
      console.error("Error retrieving case row by ID:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving the case row." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Case row not found" });
    }
    res.status(200).json(results[0]);
  });
});

// ******************************************************************************************************************
app.put("/api/case_rows/:id", (req, res) => {
  const caseRowId = req.params.id;
  const { case_id, case_row_number } = req.body;
  const sql =
    "UPDATE case_rows SET case_id=?, case_row_number=? WHERE case_row_id=?";
  db.query(sql, [case_id, case_row_number, caseRowId], (err, result) => {
    if (err) {
      console.error("Error updating case row:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while updating the case row." });
    }
    res.status(200).json({ message: "Case row updated successfully" });
  });
});

// ******************************************************************************************************************
app.delete("/api/case_rows/:id", (req, res) => {
  const caseRowId = req.params.id;
  const sql = "DELETE FROM case_rows WHERE case_row_id=?";
  db.query(sql, [caseRowId], (err, result) => {
    if (err) {
      console.error("Error deleting case row:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while deleting the case row." });
    }
    res.status(200).json({ message: "Case row deleted successfully" });
  });
});

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Addresses        ***********************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Define a route to create a new address
app.post("/api/addresses", (req, res) => {
  // Extract address data from the request body
  const {
    case_row_id,
    number,
    address1,
    address2,
    city,
    state,
    zip_code,
    /* additional address data */
  } = req.body;

  // Insert the address data into the database
  const sql =
    "INSERT INTO addresses (case_row_id, number, address1, address2, city, state, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [
      case_row_id,
      number,
      address1,
      address2,
      city,
      state,
      zip_code /* additional values */,
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

// ******************************************************************************************************************
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

// ******************************************************************************************************************
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

// ******************************************************************************************************************
app.put("/api/addresses/:id", (req, res) => {
  const addressId = req.params.id;
  const { case_row_id, number, address1, address2, city, state, zip_code } =
    req.body;
  const sql =
    "UPDATE addresses SET case_row_id=?, number=?, address1=?, address2=?, city=?, state=?, zip_code=? WHERE address_id=?";
  db.query(
    sql,
    [case_row_id, number, address1, address2, city, state, zip_code, addressId],
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

// ******************************************************************************************************************
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

// ******************************************************************************************************************

// Define other routes and middleware as needed

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
