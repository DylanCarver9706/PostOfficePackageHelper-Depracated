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
require("dotenv").config({
  path: "C:/Users/Dylan/PostOfficePackageHelper/PostOfficePackageHelperV1.1/PostOfficePackageHelperV1.1/.env",
});
const sharp = require("sharp");
const fs = require("fs");
const { OpenAI } = require("openai");

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
  database: process.env.MYSQL_CREDENTIALS_DATABASE,
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
// ******        OpenAIApi        ***********************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Used in Google Vision Api for extracting addresses from extracted text

// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******        GOOGLE VISION API + OpenAi Api        **************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************
// ******************************************************************************************************************

const CONFIG = {
  credentials: {
    private_key: process.env.GOOGLE_VISION_CREDENTIALS_PRIVATE_KEY,
    client_email: process.env.GOOGLE_VISION_CREDENTIALS_CLIENT_EMAIL,
  },
};

// Initialize a Google Cloud Vision client
const client = new vision.ImageAnnotatorClient(CONFIG);

// Define a route to perform object detection, cropping, and text recognition
app.post(
  "/api/recognize-image-objects",
  upload.single("imageUri"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "Image data is missing in the request body" });
      }

      const base64ImageData = req.file.buffer.toString("base64");

      const [result1] = await client.objectLocalization(
        Buffer.from(base64ImageData, "base64")
      );

      if (result1.error) {
        console.error("Google Cloud Vision API error:", result1.error.message);
        return res.status(500).json({ error: "Error processing image" });
      }

      // LocalizedObjects response
      // console.log(JSON.stringify(result1, null, 2));

      // Filter and select the object with "mid" = "/j/8sk4f3"
      const packageLabels = result1.localizedObjectAnnotations.filter(
        (annotation) => annotation.mid === "/j/8sk4f3"
      );

      // Use sharp to get the image dimensions dynamically
      sharp(req.file.buffer)
        .metadata()
        .then((metadata) => {
          const imageWidth = metadata.width;
          const imageHeight = metadata.height;
          // console.log("Image dimensions");
          // console.log(
          //   "Image Width: " + imageWidth + " Image Height: " + imageHeight
          // );
          // console.log("####################################################");

          // Calculate the pixel coordinates based on the image dimensions
          const startX1 = Math.floor(
            packageLabels[0].boundingPoly.normalizedVertices[0].x * imageWidth
          );
          const startY1 = Math.floor(
            packageLabels[0].boundingPoly.normalizedVertices[0].y * imageHeight
          );
          const endX1 = Math.floor(
            packageLabels[0].boundingPoly.normalizedVertices[2].x * imageWidth
          );
          const endY1 = Math.floor(
            packageLabels[0].boundingPoly.normalizedVertices[2].y * imageHeight
          );

          // Log the coordinates of the shipping label
          // console.log("Shipping Label Coordinates:");
          // console.log(`StartX1: ${startX1}, StartY1: ${startY1}`);
          // console.log(`EndX1: ${endX1}, EndY1: ${endY1}`);
          // console.log("####################################################");

          // console.log("endX1 - startX1: " + (endX1 - startX1));

          let startLeft = startX1 - Math.floor((endX1 - startX1) * 0.35);
          if (startLeft < 1) {
            startLeft = 0;
          }
          // console.log("Start Left: " + startLeft);

          let startTop = startY1 - Math.floor((endX1 - startX1) * 2);
          if (startTop < 1) {
            startTop = 0;
          }
          // console.log("Start Top: " + startTop);

          let cropWidth = startLeft + Math.floor((endX1 - startX1) * 1.6);
          if (cropWidth > imageWidth - startLeft) {
            cropWidth = imageWidth - startLeft;
          }
          // console.log("Crop Width: " + cropWidth);

          let cropHeight = startTop + Math.floor((endX1 - startX1) * 2.25);
          if (cropHeight > imageHeight - startTop) {
            cropHeight = imageHeight - startTop;
          }
          // console.log("Crop Height: " + cropHeight);
          // console.log("####################################################");

          // Crop the image to the specified coordinates
          sharp(req.file.buffer)
            .extract({
              left: startLeft,
              top: startTop,
              width: cropWidth,
              height: cropHeight,
            })
            .toBuffer()
            .then(async (croppedBuffer) => {
              // Convert the cropped image buffer to base64
              const croppedBase64 = croppedBuffer.toString("base64");

              // #############################################################################
              // Cropped image
              // #############################################################################

              // fs.writeFileSync("./croppedImage.txt", croppedBase64);
              // console.log("Cropped Image Base64 written to croppedImage.txt.");

              // #############################################################################
              // Extract text from cropped image
              // #############################################################################

              const [result] = await client.textDetection(
                Buffer.from(croppedBase64, "base64")
              );

              if (result.error) {
                console.error(
                  "Google Cloud Vision API error:",
                  result.error.message
                );
                return res
                  .status(500)
                  .json({ error: "Error processing image" });
              }

              // console.log("Full GV Response: \n" + JSON.stringify(result, null, 2))
              extractedTextDescription = result.textAnnotations[0].description;
              // console.log(extractedTextDescription);

              const promptResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                temperature: 0.2,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a warehouse machine in charge of returning the addresses on package labels",
                  },
                  {
                    role: "user",
                    content: `Here is extracted text from a picture of a package label: ${extractedTextDescription}\n\n Please return the customer/business names and their address from that text as an array of JSON objects with key/value pairs for customer_or_business_name, address1, address2, city, state, and zip_code. There are only 2 addresses in there.`,
                  },
                ],
              });

              const jsonObject = JSON.parse(
                promptResponse.choices[0].message.content
              );
              console.log(
                "Prompt json object: \n" + JSON.stringify(jsonObject, null, 2)
              );

              res.header("Content-Type", "application/json; charset=utf-8");
              res.json({ text: jsonObject[1] });
            })
            .catch((error) => {
              console.error("Error cropping image:", error);
              res.status(500).json({ error: "Internal server error" });
            });
        })
        .catch((error) => {
          console.error("Error getting image dimensions:", error);
          res.status(500).json({ error: "Internal server error" });
        });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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

  // Query the database to get the hashed password and active_status for the provided email
  const sql =
    "SELECT user_id, password, first_name, last_name, active_status FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ error: "An error occurred" });
    }

    if (results.length === 0) {
      // User not found
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user_id = results[0].user_id;
    const hashedPassword = results[0].password;
    const firstName = results[0].first_name;
    const lastName = results[0].last_name;
    const activeStatus = results[0].active_status;

    if (activeStatus) {
      // User has an active account, compare the provided password with the hashed password
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
    } else {
      // User account is not active
      res.status(401).json({ message: "Account is not active" });
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
    const { first_name, last_name, email, phone_number, position, firebase_user_uid } = req.body;

    // Insert the user's information into the database
    const sql =
      "INSERT INTO users (first_name, last_name, email, phone_number, position, firebase_user_uid) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [first_name, last_name, email, phone_number, position, firebase_user_uid],
      (err, result) => {
        if (err) {
          console.error("Error registering user:", err);
          return res
            .status(500)
            .json({ error: "An error occurred while registering the user." });
        }

        // Successfully inserted user, get the user's ID from the result
        const userId = result.insertId;

        console.log("User registered successfully");
        // Return the user's information in the response
        res.status(201).json({
          message: "User registered successfully",
          user: {
            id: userId,
            first_name,
            last_name,
            email,
            phone_number,
            position,
            firebase_user_uid
          },
        });
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
  const sql =
    "SELECT first_name, last_name, email, phone_number, position FROM users WHERE user_id = ?";
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

// Function to get the user data after a login
app.get("/api/afterLoginUserData", (req, res) => {
  const { email, firebase_user_uid } = req.query;

  if (!email || !firebase_user_uid) {
    return res.status(400).json({ error: "Missing email or firebase_user_uid in query params" });
  }

  const sql =
    "SELECT user_id, first_name, last_name, email, phone_number, position, firebase_user_uid FROM users WHERE email = ? AND firebase_user_uid = ?";
  
  db.query(sql, [email, firebase_user_uid], (err, results) => {
    if (err) {
      console.error("Error retrieving user by email and Firebase user UID:", err);
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
app.put("/api/users/:id", async (req, res) => {
  const userId = req.params.id;
  const { first_name, last_name, email, phone_number, position } = req.body;

  try {
    // Hash the password here before saving it to the database
    // ...

    const sql =
      "UPDATE users SET first_name=?, last_name=?, email=?, phone_number=?, position=? WHERE user_id=?";
    db.query(
      sql,
      [first_name, last_name, email, phone_number, position, userId],
      async (err, result) => {
        if (err) {
          console.error("Error updating user:", err);
          return res
            .status(500)
            .json({ error: "An error occurred while updating the user." });
        }

        // Check if the update was successful
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        console.log("User updated successfully");

        // Fetch the updated user information from the database
        const getUserSql =
          "SELECT user_id, first_name, last_name, email, phone_number, position FROM users WHERE user_id=?";
        db.query(getUserSql, [userId], (err, userResult) => {
          if (err) {
            console.error("Error fetching updated user:", err);
            return res.status(500).json({
              error: "An error occurred while fetching the updated user.",
            });
          }

          const updatedUser = userResult[0];

          // Return the updated user information in the response (excluding password)
          res.status(200).json({
            message: "User updated successfully",
            user: updatedUser,
          });
        });
      }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the user." });
  }
});

// Update the 'active_status' of a specific item by ID using PATCH
app.patch("/api/users/delete/:id", (req, res) => {
  const userId = req.params.id;
  const { active_status } = req.body; // Include 'active_status' in the request body

  const sql = "UPDATE users SET active_status = ? WHERE user_id = ?";

  db.query(sql, [active_status, userId], (err, result) => {
    if (err) {
      console.error("Error updating 'active_status':", err);
      res.status(500).json({
        error: "An error occurred while updating the 'active_status'.",
      });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Item not found" });
      } else {
        res.status(200).json({
          message: "'Active Status' updated successfully",
        });
      }
    }
  });
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
  const {
    user_id,
    city,
    state,
    supervisor_name,
    supervisor_phone_number,
    postmaster_name,
    postmaster_phone_number,
  } = req.body;

  // Insert the office data into the database
  const sql =
    "INSERT INTO offices (user_id, city, state, supervisor_name, supervisor_phone_number, postmaster_name, postmaster_phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [
      user_id,
      city,
      state,
      supervisor_name,
      supervisor_phone_number,
      postmaster_name,
      postmaster_phone_number,
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating office:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while creating the office." });
      }

      // Successfully created office, get the office ID from the result
      const officeId = result.insertId;

      console.log("Office created successfully");
      // Return the office's information in the response
      res.status(201).json({
        message: "Office created successfully",
        office: {
          id: officeId,
          user_id,
          city,
          state,
          supervisor_name,
          supervisor_phone_number,
          postmaster_name,
          postmaster_phone_number,
        },
      });
    }
  );
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

// Get all offices by user_id
app.get("/api/officesByUserId", (req, res) => {
  const user_id = req.query.user_id;
  const sql = "SELECT * FROM offices WHERE user_id = ?";

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Error retrieving offices by user_id:", err);
      return res.status(500).json({
        error: "An error occurred while retrieving offices by user_id.",
      });
    }
    res.status(200).json(results);
  });
});

// ******************************************************************************************************************
// Update an office by ID
app.put("/api/offices/:id", (req, res) => {
  const officeId = req.params.id;
  const {
    city,
    state,
    phone_number,
    supervisor_name,
    supervisor_phone_number,
    postmaster_name,
    postmaster_phone_number,
  } = req.body;
  const sql =
    "UPDATE offices SET city=?, state=?, supervisor_name=?, supervisor_phone_number=?, postmaster_name=?, postmaster_phone_number=? WHERE office_id=?";
  db.query(
    sql,
    [
      city,
      state,
      supervisor_name,
      supervisor_phone_number,
      postmaster_name,
      postmaster_phone_number,
      officeId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating office:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while updating the office." });
      }

      // Check if any rows were affected by the update
      if (result.affectedRows > 0) {
        // Office was updated successfully, retrieve the updated office data
        const updatedOffice = {
          office_id: officeId,
          city,
          state,
          supervisor_name,
          supervisor_phone_number,
          postmaster_name,
          postmaster_phone_number,
        };

        res.status(200).json({
          message: "Office updated successfully",
          office: updatedOffice,
        });
      } else {
        // No rows were affected, meaning the office with the specified ID was not found
        res.status(404).json({ error: "Office not found" });
      }
    }
  );
});

app.patch("/api/offices/delete/:id", (req, res) => {
  const officeId = req.params.id;
  const { active_status } = req.body; // Include 'active_status' in the request body

  const sql = "UPDATE offices SET active_status = ? WHERE office_id = ?";

  db.query(sql, [active_status, officeId], (err, result) => {
    if (err) {
      console.error("Error updating 'active_status' for office:", err);
      res.status(500).json({
        error:
          "An error occurred while updating the 'active_status' for office.",
      });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Office not found" });
      } else {
        res.status(200).json({
          message: "'Active Status' for office updated successfully",
        });
      }
    }
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

    // Successfully created the route, get the route ID from the result
    const routeId = result.insertId;

    console.log("Route created successfully");
    // Return the route's information in the response
    res.status(201).json({
      message: "Route created successfully",
      route: {
        id: routeId,
        route_number,
        office_id,
      },
    });
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

    if (result.affectedRows === 0) {
      // No rows were affected, indicating that the route with the specified ID was not found
      return res.status(404).json({ error: "Route not found" });
    }

    console.log("Route updated successfully");
    // Return the updated route information in the response
    res.status(200).json({
      message: "Route updated successfully",
      route: {
        route_id: routeId,
        route_number,
        office_id,
      },
    });
  });
});

app.patch("/api/routes/delete/:id", (req, res) => {
  const routeId = req.params.id;
  const { active_status } = req.body; // Include 'active_status' in the request body

  const sql = "UPDATE routes SET active_status = ? WHERE route_id = ?";

  db.query(sql, [active_status, routeId], (err, result) => {
    if (err) {
      console.error("Error updating 'active_status' for route:", err);
      res.status(500).json({
        error:
          "An error occurred while updating the 'active_status' for route.",
      });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Route not found" });
      } else {
        res.status(200).json({
          message: "'Active Status' for route updated successfully",
        });
      }
    }
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
    position_number,
    address1,
    address2,
    city,
    state,
    zip_code,
    route_id,
  } = req.body;

  // Insert the address data into the database
  const sql = `INSERT INTO addresses (case_number, case_row_number, position_number, address1, address2, city, state, zip_code, route_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      case_number,
      case_row_number,
      position_number,
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

      // Successfully created address, get the newly created address's ID from the result
      const addressId = result.insertId;

      console.log("Address created successfully");
      // Return the newly created address data in the response
      res.status(201).json({
        message: "Address created successfully",
        address: {
          id: addressId,
          case_number,
          case_row_number,
          position_number,
          address1,
          address2,
          city,
          state,
          zip_code,
          route_id,
        },
      });
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
app.get("/api/addressesByRouteAndCaseAndRow", (req, res) => {
  const routeId = req.query.route_id;
  const caseNumber = req.query.case_number;
  const caseRowNumber = req.query.case_row_number;
  const orderBy = req.query.orderBy || "address_id"; // Default to ordering by address_id if orderBy is not provided

  const sql = `SELECT * FROM addresses WHERE route_id=? AND case_number=? AND case_row_number=? ORDER BY ${orderBy}`;

  db.query(sql, [routeId, caseNumber, caseRowNumber], (err, result) => {
    if (err) {
      console.error("Error fetching addresses:", err);
      return res.status(500).json({
        error: "An error occurred while fetching addresses.",
      });
    }

    res.status(200).json(result);
  });
});

app.get("/api/addressesByFormattedData", (req, res) => {
  const { fullAddress } = req.query;

  if (!fullAddress) {
    return res.status(400).json({ error: "fullAddress is required." });
  }

  const uppercasedFullAddress = fullAddress.toUpperCase();

  console.log(`Input fullAddress: "${uppercasedFullAddress}"`);

  const sql = `
    SELECT *
    FROM addresses
    WHERE UPPER(CONCAT(address1, " ", IFNULL(address2, ""), city, " ", state, " ", zip_code)) = UPPER(?)
  `;

  db.query(sql, [uppercasedFullAddress], (err, results) => {
    if (err) {
      console.error("Error retrieving addresses:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving addresses." });
    }
    // console.log("SQL Query:", sql);
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
    position_number,
    address1,
    address2,
    city,
    state,
    zip_code,
    route_id,
  } = req.body;
  const sql = `UPDATE addresses SET case_number=?, case_row_number=?, position_number=?, address1=?, address2=?, city=?, state=?, zip_code=?, route_id=? WHERE address_id=?`;
  db.query(
    sql,
    [
      case_number,
      case_row_number,
      position_number,
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

      // Check if any rows were affected by the update
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Address not found" });
      }

      console.log("Address updated successfully");

      // Fetch the updated address from the database and send it in the response
      const fetchUpdatedAddressSql =
        "SELECT * FROM addresses WHERE address_id=?";
      db.query(fetchUpdatedAddressSql, [addressId], (fetchErr, fetchResult) => {
        if (fetchErr) {
          console.error("Error fetching updated address:", fetchErr);
          return res.status(500).json({
            error: "An error occurred while fetching the updated address.",
          });
        }

        // Return the updated address in the response
        const updatedAddress = fetchResult[0];
        res.status(200).json({
          message: "Address updated successfully",
          address: updatedAddress,
        });
      });
    }
  );
});

app.put("/api/addresses/:id/reorder", (req, res) => {
  const addressId = req.params.id;
  const { position_number } = req.body;
  const sql = `UPDATE addresses SET position_number=? WHERE address_id=?`;
  db.query(sql, [position_number, addressId], (err, result) => {
    if (err) {
      console.error("Error updating address order:", err);
      return res.status(500).json({
        error: "An error occurred while updating the address order.",
      });
    }

    // Check if any rows were affected by the update
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Address not found" });
    }

    // console.log("Address order updated successfully");
    res.status(200).json({ message: "Address order updated successfully" });
  });
});

app.patch("/api/addresses/delete/:id", (req, res) => {
  const addressId = req.params.id;
  const { active_status } = req.body; // Include 'active_status' in the request body

  const sql = "UPDATE addresses SET active_status = ? WHERE address_id = ?";

  db.query(sql, [active_status, addressId], (err, result) => {
    if (err) {
      console.error("Error updating 'active_status' for address:", err);
      res.status(500).json({
        error:
          "An error occurred while updating the 'active_status' for address.",
      });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Address not found" });
      } else {
        res.status(200).json({
          message: "'Active Status' for address updated successfully",
        });
      }
    }
  });
});

app.patch(
  "/api/patchDeleteAddressesByCaseAndRoute/:case_number/:route_id",
  (req, res) => {
    const { case_number, route_id } = req.params;
    const { active_status } = req.body;

    // Ensure that active_status is provided in the request body
    if (active_status === undefined) {
      return res
        .status(400)
        .json({ error: "active_status is required in the request body." });
    }

    // Convert active_status to a boolean value (true or false)
    const isActive = active_status.toLowerCase() === "true";

    // Construct the SQL query to update the active_status for addresses
    const sql =
      "UPDATE addresses SET active_status = ? WHERE case_number = ? AND route_id = ?";

    db.query(sql, [isActive, case_number, route_id], (err, result) => {
      if (err) {
        console.error("Error updating active_status by case and route:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while updating active_status." });
      }

      res.status(200).json({
        message: `Active status for addresses with case ${case_number} on route ${route_id} updated successfully`,
      });
    });
  }
);

// Delete an address by ID along with associated deliveries
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

app.delete("/api/deleteAddressesByCaseAndRoute", (req, res) => {
  const { case_number, route_id } = req.query;

  // Ensure that case_number and route_id are provided in the query parameters
  if (!case_number || !route_id) {
    return res
      .status(400)
      .json({ error: "Both case_number and route_id are required." });
  }

  // Construct the SQL query to delete addresses
  const sql = "DELETE FROM addresses WHERE case_number = ? AND route_id = ?";

  db.query(sql, [case_number, route_id], (err, result) => {
    if (err) {
      console.error("Error deleting addresses by case and route:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while deleting addresses." });
    }

    res.status(200).json({
      message: `Addresses for case ${case_number} on route ${route_id} deleted successfully`,
    });
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
  const {
    route_id,
    address_id,
    delivery_date,
    package_marker_number,
    scanned,
    out_for_delivery,
    delivered,
  } = req.body;

  const sql =
    "INSERT INTO deliveries (route_id, address_id, delivery_date, package_marker_number, scanned, out_for_delivery, delivered) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.query(
    sql,
    [
      route_id,
      address_id,
      delivery_date,
      package_marker_number,
      scanned,
      out_for_delivery,
      delivered,
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating delivery:", err);
        res
          .status(500)
          .json({ error: "An error occurred while creating the delivery." });
      } else {
        // Successfully created delivery, get the delivery's ID from the result
        const deliveryId = result.insertId;

        res.status(201).json({
          message: "Delivery created successfully",
          delivery: {
            id: deliveryId,
            route_id,
            address_id,
            delivery_date,
            package_marker_number,
            scanned,
            out_for_delivery,
            delivered,
          },
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
    SELECT deliveries.*, addresses.address1, addresses.case_number, addresses.case_row_number, addresses.position_number, addresses.address2, addresses.city, addresses.state, addresses.zip_code, addresses.active_status, r.active_status
    FROM deliveries
    LEFT JOIN addresses ON deliveries.address_id = addresses.address_id
    LEFT JOIN routes AS r ON deliveries.route_id = r.route_id
    WHERE deliveries.route_id = ? AND DATE(deliveries.delivery_date) = ? AND addresses.active_status = 1 AND r.active_status = 1
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
      delivery_date: new Date(result.delivery_date).toISOString().split("T")[0],
    }));

    res.status(200).json(formattedResults);
  });
});

// Update a specific delivery by ID
app.put("/api/deliveries/:id", (req, res) => {
  const deliveryId = req.params.id;
  const {
    route_id,
    address_id,
    scanned,
    package_marker_number,
    out_for_delivery,
    delivered,
  } = req.body;

  const sql =
    "UPDATE deliveries SET route_id = ?, address_id = ?, scanned = ?, package_marker_number = ?, out_for_delivery = ?, delivered = ? WHERE delivery_id = ?";

  db.query(
    sql,
    [
      route_id,
      address_id,
      scanned,
      package_marker_number,
      out_for_delivery,
      delivered,
      deliveryId,
    ],
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
          // Fetch the updated delivery from the database
          db.query(
            "SELECT * FROM deliveries WHERE delivery_id = ?",
            [deliveryId],
            (err, rows) => {
              if (err) {
                console.error("Error fetching updated delivery:", err);
                res.status(500).json({
                  error:
                    "An error occurred while fetching the updated delivery.",
                });
              } else {
                // Successfully updated delivery, include the updated delivery data in the response
                const updatedDelivery = rows[0]; // Assuming it's a single delivery
                res.status(200).json({
                  message: "Delivery updated successfully",
                  delivery: updatedDelivery,
                });
              }
            }
          );
        }
      }
    }
  );
});

// Update the 'delivered' status of a specific delivery by ID using PATCH
app.patch("/api/deliveries/:id", (req, res) => {
  const deliveryId = req.params.id;
  const { delivered } = req.body; // Only include 'delivered' in the request body

  const sql = "UPDATE deliveries SET delivered = ? WHERE delivery_id = ?";

  db.query(sql, [delivered, deliveryId], (err, result) => {
    if (err) {
      console.error("Error updating 'delivered' status:", err);
      res.status(500).json({
        error: "An error occurred while updating the 'delivered' status.",
      });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Delivery not found" });
      } else {
        // Successfully updated 'delivered' status, include the updated status in the response
        res.status(200).json({
          message: "'Delivered' status updated successfully",
        });
      }
    }
  });
});

// Update the 'active_status' of a specific item by ID using PATCH
app.patch("/api/deliveries/delete/:id", (req, res) => {
  const deliveryId = req.params.id;
  const { active_status } = req.body; // Include 'active_status' in the request body

  const sql = "UPDATE deliveries SET active_status = ? WHERE delivery_id = ?";

  db.query(sql, [active_status, deliveryId], (err, result) => {
    if (err) {
      console.error("Error updating 'active_status':", err);
      res.status(500).json({
        error: "An error occurred while updating the 'active_status'.",
      });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Item not found" });
      } else {
        // Successfully updated 'active_status', include the updated status in the response
        res.status(200).json({
          message: "'Active Status' updated successfully",
          updatedDeliveryId: deliveryId,
          active_status: active_status,
        });
      }
    }
  });
});

// Delete a specific delivery by ID
app.delete("/api/deliveries/:id", (req, res) => {
  const deliveryId = req.params.id;
  const sql = "DELETE FROM deliveries WHERE delivery_id=?";
  db.query(sql, [deliveryId], (err, result) => {
    if (err) {
      console.error("Error deleting delivery:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while deleting the delivery." });
    }
    res.status(200).json({ message: "Delivery deleted successfully" });
  });
});
