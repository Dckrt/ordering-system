const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'orders route working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'place order route working' });
});

module.exports = router;