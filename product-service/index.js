const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Mock Products Data
const products = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    price: 299.99,
    description: 'High-quality noise-canceling wireless headphones.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    category: 'Electronics'
  },
  {
    id: 2,
    name: 'Minimalist Smart Watch',
    price: 199.50,
    description: 'Elegant smartwatch with fitness tracking capabilities.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
    category: 'Accessories'
  },
  {
    id: 3,
    name: 'Professional Camera Lens',
    price: 850.00,
    description: '50mm f/1.4 prime lens for professional photography.',
    image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=800&auto=format&fit=crop',
    category: 'Photography'
  },
  {
    id: 4,
    name: 'Mechanical Keyboard',
    price: 145.00,
    description: 'RGB mechanical keyboard with tactile switches.',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop',
    category: 'Gaming'
  },
  {
    id: 5,
    name: 'Ergonomic Office Chair',
    price: 350.00,
    description: 'Comfortable mesh chair for long working hours.',
    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=800&auto=format&fit=crop',
    category: 'Furniture'
  },
  {
    id: 6,
    name: 'Portable SSD 1TB',
    price: 129.99,
    description: 'High-speed external solid-state drive.',
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=800&auto=format&fit=crop',
    category: 'Electronics'
  }
];

app.get('/products', (req, res) => {
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
