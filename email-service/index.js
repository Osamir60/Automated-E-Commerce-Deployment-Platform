const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
const api = express.Router();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5004;

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

// Define User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
  },
});

// Sync database and seed admin
sequelize.sync().then(async () => {
  console.log('PostgreSQL synced for email-service');
  let adminExists;
  try {
    adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
  } catch (err) {
    console.log('User table not ready or error checking admin:', err.message);
  }

  if (!adminExists) {
    await User.create({
      id: 'admin-001',
      name: 'admin',
      email: 'admin@example.com',
      password: '12345',
      role: 'admin',
    });
    console.log('Admin user created');
  }
}).catch(err => console.error('Database sync error:', err));


api.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = await User.create({
      id: Date.now().toString(),
      name,
      email,
      password,
      role: 'user'
    });
    
    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

api.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ where: { email, password } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.use('/api/email', api);
app.use('/', api);

app.listen(PORT, () => {
  console.log(`Auth/Email Service running on port ${PORT}`);
});
