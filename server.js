require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ تعديل مهم

// Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// DB Connection

const db = mysql.createConnection({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.replace("/", ""),
  port: url.port,
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected!");
});

// Add Product

app.post("/products", upload.single("image"), (req, res) => {
  const { title, description, price, category_id } = req.body;
  const image_url = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : "";

  const sql =
    "INSERT INTO products (title, description, price, image_url, category_id) VALUES (?, ?, ?, ?, ?)";
  db.query(
    sql,
    [title, description, price, image_url, category_id],
    (err, result) => {
      if (err) {
        console.error("❌ Insert Error:", err);
        return res.status(500).send(err);
      }
      res.send({ message: "✅ Product added successfully!" });
    }
  );
});

// Get Products
app.get("/products", (req, res) => {
  const { category } = req.query;

  let sql = `
    SELECT 
      products.id,
      products.title,
      products.description,
      products.price,
      products.image_url,
      products.created_at,
      categories.name AS category
    FROM products
    JOIN categories ON products.category_id = categories.id
  `;

  const params = [];
  if (category) {
    sql += " WHERE products.category_id = ?";
    params.push(category);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Fetch Error:", err);
      return res.status(500).send(err);
    }
    res.send(results);
  });
});

// Dashboard Filter
app.get("/categories", (req, res) => {
  const sql = "SELECT * FROM categories";
  db.query(sql, (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(result);
  });
});

// Edit and Delete
// حذف منتج
app.delete("/products/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "تم الحذف" });
  });
});

// تعديل منتج
app.put("/products/:id", upload.single("image"), (req, res) => {
  const { title, description, price } = req.body;
  const image = req.file
    ? `http://localhost:3001/uploads/${req.file.filename}`
    : null;

  const sql = image
    ? "UPDATE products SET title = ?, description = ?, price = ?, image_url = ? WHERE id = ?"
    : "UPDATE products SET title = ?, description = ?, price = ? WHERE id = ?";

  const values = image
    ? [title, description, price, image, req.params.id]
    : [title, description, price, req.params.id];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "تم التعديل" });
  });
});

// Start Server
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
