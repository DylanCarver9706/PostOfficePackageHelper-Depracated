const express = require("express");
const app = express();
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const xmlbuilder2 = require("xmlbuilder2");
// const { ImageAnnotatorClient } = require('@google-cloud/vision');
const vision = require("@google-cloud/vision");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer();
require('dotenv').config({ path: 'C:/Users/Dylan/PostOfficePackageHelper/PostOfficePackageHelperV1.1/PostOfficePackageHelperV1.1/.env' })

// Use the cors middleware
app.use(cors());

// Middleware to parse JSON request bodies
// app.use(express.json());

// Use body-parser middleware with a higher limit
app.use(bodyParser.json({ limit: "1000mb" }));

const PORT = process.env.PORT;
// console.log(PORT)
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Database        ************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Create the MySQL database connection
const db = mysql.createConnection({
  host: process.env.MYSQL_CREDENTIALS_HOST,
  user: process.env.MYSQL_CREDENTIALS_USER,
  password: process.env.MYSQL_CREDENTIALS_PASSWORD,
  database: process.env.MYSQL_CREDENTIALS_DATABASE
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
// ******        GOOGLE VISION API        ***************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

const CONFIG = {
  credentials: {
    private_key: process.env.GOOGLE_VISION_CREDENTIALS_PRIVATE_KEY,
    client_email: process.env.GOOGLE_VISION_CREDENTIALS_CLIENT_EMAIL
  },
};

// Initialize a Google Cloud Vision client
const client = new vision.ImageAnnotatorClient(CONFIG);

// Define a route to perform text recognition
app.post("/api/recognize-text", upload.single("imageUri"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Image data is missing in the request body" });
    }

    const base64ImageData = req.file.buffer.toString("base64");

    const [result] = await client.textDetection(
      Buffer.from(base64ImageData, "base64")
    );

    if (result.error) {
      console.error("Google Cloud Vision API error:", result.error.message);
      return res.status(500).json({ error: "Error processing image" });
    }

    console.log(result.textAnnotations[0].description);
    // console.log(result.textAnnotations);
    const textAnnotations = result.textAnnotations || [];
    const recognizedText = textAnnotations.length
      ? textAnnotations[0].description
      : "";
    res.header("Content-Type", "application/json; charset=utf-8");
    res.json({ text: recognizedText });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        USPS API        ************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// let root = xmlbuilder2
//   .create({ version: "1.0" })
//   .ele("AddressValidateRequest", { USERID: "177PERSO17Q97" })
//   .ele("Address")
//   .ele("Address1")
//   .txt("185 Berry St")
//   .up()
//   .ele("Address2")
//   .txt("Suite 6100")
//   .up()
//   .ele("City")
//   .txt("San Francisco")
//   .up()
//   .ele("State")
//   .txt("CA")
//   .up()
//   .ele("Zip5")
//   .txt("94556")
//   .up()
//   .ele("Zip4")
//   .up()
//   .up();

// let xml = root.end({ prettyPrint: true });
// let url =
//   "https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&xml=" +
//   encodeURIComponent(xml);

// fetch(url)
//   .then((response) => {
//     if (!response.ok) {
//       throw new Error("Network response was not ok");
//     }
//     return response.text();
//   })
//   .then((data) => {
//     const obj = xmlbuilder2.convert(data, { format: "object" });
//     console.log(obj);
//   })
//   .catch((error) => {
//     console.error("Fetch Error:", error);
//   });

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Auth        ****************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

const sessionSecretKey = process.env.SESSION_SECRET_KEY;

app.use(
  session({
    secret: sessionSecretKey,
    resave: false,
    saveUninitialized: false,
  })
);

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Query the database to get the hashed password for the provided email
  const sql =
    "SELECT user_id, password, first_name, last_name FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ error: "An error occurred" });
    }

    if (results.length === 0) {
      // User not found
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.log(results[0]);
    const user_id = results[0].user_id;
    const hashedPassword = results[0].password;
    const firstName = results[0].first_name;
    const lastName = results[0].last_name;

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (passwordMatch) {
      // Passwords match, set user data in the session
      req.session.user = { email, user_id, firstName, lastName };
      res.status(200).json({
        message: "Login successful",
        user: { email, user_id, firstName, lastName },
      }); // Return user data in the response
    } else {
      // Passwords do not match
      res.status(401).json({ message: "Invalid credentials" });
    }
  });
});

// Define a route to check user authentication status
// Updated /api/check-auth endpoint with user_id query parameter
app.get("/api/check-auth", (req, res) => {
  const user_id = parseInt(req.query.user_id, 10); // Parse user_id to an integer

  if (req.session.user && req.session.user.user_id === user_id) {
    // User is authenticated, send back user data from the database
    const sql = "SELECT * FROM users WHERE user_id = ?"; // Assuming user_id is the unique identifier
    db.query(sql, [user_id], (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        return res.status(500).json({ error: "An error occurred" });
      }

      if (results.length === 0) {
        // User not found in the database
        return res.status(404).json({ message: "User not found" });
      }

      const userData = results[0];
      // Include user data in the response
      res.status(200).json({ isAuthenticated: true, user: userData });
    });
  } else {
    // User is not authenticated or the provided user_id doesn't match the session user_id
    res.status(401).json({ isAuthenticated: false });
  }
});

// Logout route with user identifier as a query parameter
app.get("/api/logout", (req, res) => {
  const userId = req.query.userId; // Get the user ID from the query parameter

  // Check if the user is authenticated and the user ID matches
  if (req.session.user && req.session.user.id === userId) {
    // Destroy the user's session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "An error occurred" });
      }
      res.status(200).json({ message: "Logout successful" });
    });
  } else {
    // Unauthorized logout request
    res.status(401).json({ message: "Unauthorized" });
  }
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
    const {
      first_name,
      last_name,
      email,
      password,
      phone_number,
      home_post_office,
      position,
    } = req.body;

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user's information into the database
    const sql =
      "INSERT INTO users (first_name, last_name, email, password, phone_number, home_post_office, position) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [
        first_name,
        last_name,
        email,
        hashedPassword,
        phone_number,
        home_post_office,
        position,
      ],
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
  const { user_id, city, state, phone_number } = req.body;

  // Insert the office data into the database
  const sql =
    "INSERT INTO offices (user_id, city, state, phone_number) VALUES (?, ?, ?, ?)";
  db.query(sql, [user_id, city, state, phone_number], (err, result) => {
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

// Get all routes by officeId
app.get("/api/routesByOfficeId", (req, res) => {
  const officeId = req.query.office_id; // Get the office_id from the query parameter

  const sql = "SELECT * FROM routes WHERE office_id = ?";
  db.query(sql, [officeId], (err, results) => {
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

// Get addresses by case_number and case_row_number
app.get("/api/addressesByCaseAndRow", (req, res) => {
  const { case_number, case_row_number } = req.query;

  if (!case_number || !case_row_number) {
    return res
      .status(400)
      .json({ error: "Both case_number and case_row_number are required." });
  }

  const sql =
    "SELECT * FROM addresses WHERE case_number = ? AND case_row_number = ?";
  db.query(sql, [case_number, case_row_number], (err, results) => {
    if (err) {
      console.error("Error retrieving addresses:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving addresses." });
    }
    res.status(200).json(results);
  });
});

app.get("/api/addressesByFormattedData", (req, res) => {
  const { fullAddress } = req.query;

  if (!fullAddress) {
    return res.status(400).json({ error: "fullAddress is required." });
  }

  const uppercasedFullAddress = fullAddress.toUpperCase();

  console.log("fullAddress", uppercasedFullAddress);

  const sql = `
    SELECT *
    FROM addresses
    WHERE BINARY UPPER(CONCAT(address_number, " ", address1, " ", address2, " ", city, " ", state, " ", zip_code)) = ?
  `;

  db.query(sql, [uppercasedFullAddress], (err, results) => {
    if (err) {
      console.error("Error retrieving addresses:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving addresses." });
    }
    console.log("SQL Query:", sql);
    console.log("Results:", results);
    res.status(200).json(results);
  });
});

// Get all addresses by routeId
app.get("/api/addressesByRouteId", (req, res) => {
  const routeId = req.query.route_id; // Get the route_id from the query parameter

  const sql = "SELECT * FROM addresses WHERE route_id = ?";
  db.query(sql, [routeId], (err, results) => {
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

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        Deliveries        **********************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

// Create a new delivery
app.post("/api/deliveries", (req, res) => {
  const { route_id, address_id, delivery_date, scanned, out_for_delivery, delivered } =
    req.body;

  const sql =
    "INSERT INTO deliveries (route_id, address_id, delivery_date, scanned, out_for_delivery, delivered) VALUES (?, ?, ?, ?, ?, ?)";

  db.query(
    sql,
    [route_id, address_id, delivery_date, scanned, out_for_delivery, delivered],
    (err, result) => {
      if (err) {
        console.error("Error creating delivery:", err);
        res
          .status(500)
          .json({ error: "An error occurred while creating the delivery." });
      } else {
        res.status(201).json({
          message: "Delivery created successfully",
          id: result.insertId,
        });
      }
    }
  );
});

// Get all deliveries
app.get("/api/deliveries", (req, res) => {
  const sql = "SELECT * FROM deliveries";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error retrieving deliveries:", err);
      res
        .status(500)
        .json({ error: "An error occurred while retrieving deliveries." });
    } else {
      res.status(200).json(results);
    }
  });
});

// Get a specific delivery by ID
app.get("/api/deliveries/:id", (req, res) => {
  const deliveryId = req.params.id;
  const sql = "SELECT * FROM deliveries WHERE delivery_id = ?";

  db.query(sql, [deliveryId], (err, result) => {
    if (err) {
      console.error("Error retrieving delivery:", err);
      res
        .status(500)
        .json({ error: "An error occurred while retrieving the delivery." });
    } else {
      if (result.length === 0) {
        res.status(404).json({ error: "Delivery not found" });
      } else {
        res.status(200).json(result[0]);
      }
    }
  });
});

app.get("/api/deliveriesByRouteAndDate", (req, res) => {
  const { route_id, deliveryDate } = req.query;

  if (!route_id || !deliveryDate) {
    return res
      .status(400)
      .json({ error: "route_id and deliveryDate are required." });
  }

  // Extract the date part from the delivery_date field
  const formattedDeliveryDate = deliveryDate.substring(0, 10);

  const sql = `
    SELECT *
    FROM deliveries
    WHERE route_id = ? AND DATE(delivery_date) = ?
  `;

  db.query(sql, [route_id, formattedDeliveryDate], (err, results) => {
    if (err) {
      console.error("Error retrieving deliveries:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving deliveries." });
    }

    // Format the delivery_date field in the response to YYYY-MM-DD
    const formattedResults = results.map((result) => ({
      ...result,
      delivery_date: new Date(result.delivery_date).toISOString().split('T')[0],
    }));

    res.status(200).json(formattedResults);
  });
});

// Update a specific delivery by ID
app.put("/api/deliveries/:id", (req, res) => {
  const deliveryId = req.params.id;
  const { route_id, address_id, scanned, out_for_delivery, delivered } =
    req.body;

  const sql =
    "UPDATE deliveries SET route_id = ?, address_id = ?, scanned = ?, out_for_delivery = ?, delivered = ? WHERE delivery_id = ?";

  db.query(
    sql,
    [route_id, address_id, scanned, out_for_delivery, delivered, deliveryId],
    (err, result) => {
      if (err) {
        console.error("Error updating delivery:", err);
        res
          .status(500)
          .json({ error: "An error occurred while updating the delivery." });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).json({ error: "Delivery not found" });
        } else {
          res.status(200).json({ message: "Delivery updated successfully" });
        }
      }
    }
  );
});

// Delete a specific delivery by ID
app.delete("/api/deliveries/:id", (req, res) => {
  const deliveryId = req.params.id;
  const sql = "DELETE FROM deliveries WHERE delivery_id = ?";

  db.query(sql, [deliveryId], (err, result) => {
    if (err) {
      console.error("Error deleting delivery:", err);
      res
        .status(500)
        .json({ error: "An error occurred while deleting the delivery." });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Delivery not found" });
      } else {
        res.status(200).json({ message: "Delivery deleted successfully" });
      }
    }
  });
});
