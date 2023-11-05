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

// Use the cors middleware
app.use(cors());

// Middleware to parse JSON request bodies
// app.use(express.json());

// Use body-parser middleware with a higher limit
app.use(bodyParser.json({ limit: "1000mb" }));

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        GOOGLE VISION API        ***************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

const CREDENTIALS = JSON.parse(
  JSON.stringify({
    type: "service_account",
    project_id: "studious-legend-362319",
    private_key_id: "32eba54af545fc43e20c63d9a01adedde202b1f7",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/LEC0E8bDXQvV\nz93EnjQxPrywO4ZlxK3ePJk2S1wQ5zgSrSJ9Fz1NuHOHqYvNXFYGvSFuBcdGhx3g\n3Ge1vk+/0abhfDrg3djdB4ICzM+sDm9p20Ny/zz3g7zngnnMAU+/0c+0jR0JXyCa\ngBT4GM4IFSqNDmnY7G7J3nnQ3ZF5uy62GjRabOG6UjIg/WmNNr+0L9PEv7jGKSQa\nS9+Umn6FR5VwOwC6ofWDFZm5cAwwUEFi/whgtxtM/IjlRKg32ZlOwvvENt9f8jcs\n0T4gst7QAQf0AHLzAPiVGne3q0m8zdugR4KmybIoVIsqBRGcigCdW/M5NKQU90aY\npAvqrl17AgMBAAECggEAPwkO7rHErL9d+yrWw5GswP4gRnXiK2VONUTC+jGgElzD\nUvkusZN7nchvo7BmjhjfrsonHzmdiyZbVj0mnzk435V4EsqdOW89JihnGJhC88cw\nunVXiLAbgLu6CpYtpfRawPOkKrMK+3+X5wnLoEDBks2z4Z36jdHr9/k5LoMYiEv7\ntJBU7MFfK+R9/ywJJCOQO1B+aYbNi5Aur8IjpFaTNXGPnbjFHX6teHtsdGAyVXHC\nijfFW+PHNSHteAGBZ6EF8rKsfhu6lev9PUwm0a7d5UpneS2nl/DA0hJK3TeowLG+\nylMc+Woi3EMObfmxavA64NvPgW+pSbJeb9sLh0q7VQKBgQDkYKiu9+KO8w3u9wzV\nYjYPiNOQhymoB+S3jPG84zat9AWaVfGTWsFm9N+Fz8Nn89KPVhboQq32lJQCdlPh\nUncFJsqndVRW6wsZHR+8+NarFNMOIpWGEdLeJBhnDyhLAG+OSCJuTfvIaYvMGF3O\nHfIx5mPKiHtc5ax6NZC8I9xy3wKBgQDWS5w79t5dQnCuwk4RmqSclpx+EhzF0Jdi\nExK4Hu1joyeiG3wUWYwve/yHDXwoHIcUB0CQzn1ktIJX+8SN8phNZkIbouqarlEQ\n4mqzoVnn5iHIU+UjUdlxsCe+e+ETVTtFk/i11ACPZGIoeV0EHozvNwX904VyREhW\nsB7K2nPk5QKBgElmA3DQfIEi/rxprDc8bFGL0SsnNa0qdEjFxL/HasB3qAFVU+Hf\nDj+PvfMcthnH1El7Cru1CoIweG1eKFFHlrcSI5m0bNnOiu+UW6n5c8ziUX6+gL3p\nJpN8mFcvGO0aA8B/0IkRCTX9Lg/3WNaw6zE8caAbQ0K1Ejzo0E6XW/eTAoGAPtYi\n9M5Zu7zsr8HYBH90/1mGf80t1K9qhF6VYZnoAAxqZbVrd8gePBo+HRfOLTDYRv4t\nZ4i06h+oDMaNhxX4pNF0Vwg5hKvSp4HMyelpJH+trkEzclzgxt5heRB4GiQm4isW\nhbKpi2JjCf00Ui3nI4nd3uT0P2JYV9sC3Hab/yUCgYEAqDji0KvJ5zVEkp1m5a3J\nbKEX/6aH9rnQ/7mRFDiwlovjuDqQ7WujgyNnlzo4r3uDQLJ1A6rWq0U42GmI2i8W\n+jbxxFpR2miKbelEnfuBJias0/+Z8l0/AFbE1EnSHPT84fpHcDA1xmsiOmYvWsww\niDuvBdW9S1W5669PIkCykLs=\n-----END PRIVATE KEY-----\n",
    client_email:
      "usps-package-helper-v1-2@studious-legend-362319.iam.gserviceaccount.com",
    client_id: "116767467015726097397",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/usps-package-helper-v1-2%40studious-legend-362319.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  })
);

const CONFIG = {
  credentials: {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email,
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

let root = xmlbuilder2
  .create({ version: "1.0" })
  .ele("AddressValidateRequest", { USERID: "177PERSO17Q97" })
  .ele("Address")
  .ele("Address1")
  .txt("185 Berry St")
  .up()
  .ele("Address2")
  .txt("Suite 6100")
  .up()
  .ele("City")
  .txt("San Francisco")
  .up()
  .ele("State")
  .txt("CA")
  .up()
  .ele("Zip5")
  .txt("94556")
  .up()
  .ele("Zip4")
  .up()
  .up();

let xml = root.end({ prettyPrint: true });
let url =
  "https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&xml=" +
  encodeURIComponent(xml);

fetch(url)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.text();
  })
  .then((data) => {
    const obj = xmlbuilder2.convert(data, { format: "object" });
    console.log(obj);
  })
  .catch((error) => {
    console.error("Fetch Error:", error);
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
    secret: "Dtc+Kem2016", // Replace with a secret key
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
      subscription_status,
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

// Define other routes and middleware as needed

const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
