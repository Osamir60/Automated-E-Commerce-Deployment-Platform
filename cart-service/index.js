const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5005;

// In-memory cart store
let cart = [];

app.get('/cart', (req, res) => {
  res.json(cart);
});

app.post('/cart', (req, res) => {
  const { productId, name, price, image } = req.body;
  
  const existingItem = cart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: Date.now().toString(),
      productId,
      name,
      price,
      image,
      quantity: 1
    });
  }
  
  res.status(201).json(cart);
});

app.delete('/cart/:id', (req, res) => {
  const itemId = req.params.id;
  cart = cart.filter(item => item.id !== itemId);
  res.json(cart);
});

app.delete('/cart', (req, res) => {
  cart = []; // clear cart
  res.json(cart);
});

app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
});
