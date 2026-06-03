const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const api = express.Router();
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve local uploads if not using S3
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5001;

// Connect to PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ecom', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Define Product Model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.STRING,
  },
  image: {
    type: DataTypes.STRING, // URL to S3 or local path
    allowNull: false,
  },
});

sequelize.sync().then(() => console.log('PostgreSQL synced for product-service'));

// Configure Multer (S3 or Local)
let upload;
if (process.env.AWS_REGION && process.env.AWS_S3_BUCKET) {
  console.log('Configuring Multer for AWS S3 upload');
  const s3 = new S3Client({ region: process.env.AWS_REGION });
  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, `products/${Date.now().toString()}-${file.originalname}`);
      }
    })
  });
} else {
  console.log('Configuring Multer for Local Disk upload (S3 missing)');
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, `${Date.now()}-${file.originalname}`); }
  });
  upload = multer({ storage: storage });
}

// GET all products
api.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['id', 'DESC']] });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single product
api.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) res.json(product);
    else res.status(404).json({ message: 'Product not found' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST add new product (admin only)
api.post('/products', upload.single('imageFile'), async (req, res) => {
  try {
    const { name, price, description, category, imageUrl } = req.body;
    let finalImageUrl = '';

    if (req.file) {
      // If S3, multer-s3 attaches `location`, else we construct local URL
      finalImageUrl = req.file.location || `http://localhost:${PORT}/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    }

    if (!name || !price || !finalImageUrl) {
      return res.status(400).json({ error: 'Name, price, and image are required' });
    }

    const newProduct = await Product.create({
      name,
      price: parseFloat(price),
      description: description || '',
      category: category || 'General',
      image: finalImageUrl,
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// DELETE a product (admin only)
api.delete('/products/:id', async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (deleted) res.json({ message: 'Product deleted successfully' });
    else res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.use('/api/product', api);
app.use('/', api);

// Global Error Handler to catch Multer S3 errors
app.use((err, req, res, next) => {
  console.error('🔥 Global Error Caught:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
