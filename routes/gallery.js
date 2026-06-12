const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

// ── GET public gallery
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gallery WHERE published = true ORDER BY sort_order ASC, created_at DESC LIMIT 12'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Gallery GET error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ── GET all (admin)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gallery ORDER BY sort_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Gallery GET /all error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, image_url, category, published, sort_order } = req.body;

  if (!title || !image_url) {
    return res.status(400).json({ error: 'Title and image_url are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO gallery(title, image_url, category, published, sort_order)
       VALUES($1, $2, $3, $4, $5) RETURNING *`,
      [title, image_url, category || 'Campus Life', published !== false, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Gallery POST error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ── PUT update gallery entry
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, image_url, category, published, sort_order } = req.body;

  if (!title || !image_url) {
    return res.status(400).json({ error: 'Title and image_url are required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE gallery
       SET title=$1, image_url=$2, category=$3, published=$4, sort_order=$5
       WHERE id=$6 RETURNING *`,
      [title, image_url, category, published, sort_order, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Gallery PUT error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Gallery DELETE error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;