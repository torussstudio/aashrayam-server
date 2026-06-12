const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM testimonials WHERE published = true ORDER BY created_at DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, role, content, rating, avatar_url, published } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO testimonials(name,role,content,rating,avatar_url,published)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, role, content, rating || 5, avatar_url, published !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { name, role, content, rating, avatar_url, published } = req.body;
  try {
    const result = await pool.query(
      `UPDATE testimonials SET name=$1,role=$2,content=$3,rating=$4,avatar_url=$5,
       published=$6,updated_at=NOW() WHERE id=$7 RETURNING *`,
      [name, role, content, rating, avatar_url, published, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
