const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5004;

// In-memory mock database for users
const users = [];

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const newUser = { id: Date.now().toString(), name, email, password };
  users.push(newUser);
  
  // Return user without password
  res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ id: user.id, name: user.name, email: user.email });
});

app.listen(PORT, () => {
  console.log(`Auth/Email Service running on port ${PORT}`);
});
