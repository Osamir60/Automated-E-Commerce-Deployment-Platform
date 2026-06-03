const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const api = express.Router();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5005;

// In-memory cart store
let cart = [];

api.get('/cart', (req, res) => {
  res.json(cart);
});

api.post('/cart', (req, res) => {
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

api.delete('/cart/:id', (req, res) => {
  const itemId = req.params.id;
  cart = cart.filter(item => item.id !== itemId);
  res.json(cart);
});

api.delete('/cart', (req, res) => {
  cart = []; // clear cart
  res.json(cart);
});

app.use('/api/cart', api);
app.use('/', api);

app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
});

