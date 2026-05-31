const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;
// Use the internal Docker network name 'product-service' and its port
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:5001';

app.get('/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query parameter "q" is required' });
  }

  try {
    // Fetch products from product-service
    const response = await fetch(`${PRODUCT_SERVICE_URL}/products`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from product service: ${response.status}`);
    }
    
    const products = await response.json();
    
    // Filter products based on search query (case-insensitive)
    const lowerCaseQuery = query.toLowerCase();
    const searchResults = products.filter(product => {
      return (
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.description.toLowerCase().includes(lowerCaseQuery) ||
        product.category.toLowerCase().includes(lowerCaseQuery)
      );
    });

    res.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error while searching products' });
  }
});

app.listen(PORT, () => {
  console.log(`Search Service running on port ${PORT}`);
});
