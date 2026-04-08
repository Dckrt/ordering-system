const express = require('express');
const router = express.Router();

// placeholder - lalagyan ng Oracle later
router.post('/login', (req, res) => {
  res.json({ message: 'login route working' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'register route working' });
});

module.exports = router;