const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const api = express.Router();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5003;

api.get('/payment', (req, res) => {
  res.json({ message: 'Payment Service is running' });
});

app.use('/api/payment', api);
app.use('/', api);

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});

