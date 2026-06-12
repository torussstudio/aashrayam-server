const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const { getEnv } = require('../config/env');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM members WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { jwtSecret } = getEnv();
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM members WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/setup — create first admin (only if no admins exist)
router.post('/setup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await pool.query('SELECT COUNT(*) FROM members');
    if (parseInt(existing.rows[0].count) > 0) {
      return res.status(403).json({ error: 'Admin already exists. Use login.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO members(name, email, password_hash, role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role',
      [name, email, hash, 'admin']
    );

    const { jwtSecret } = getEnv();
    const token = jwt.sign(
      { id: result.rows[0].id, email, role: 'admin', name },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({ token, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
