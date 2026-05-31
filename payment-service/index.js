const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5003;

app.get('/payment', (req, res) => {
  res.json({ message: 'Payment Service is running' });
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
