const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/news — public
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM news WHERE published = true ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/news/all — admin
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/news/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/news — admin
router.post('/', authMiddleware, async (req, res) => {
  const { title, excerpt, content, category, badge_text, badge_color, image_url, published } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO news(title,excerpt,content,category,badge_text,badge_color,image_url,published)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, excerpt, content, category || 'General', badge_text, badge_color || '#2D7D6F', image_url, published !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/news/:id — admin
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, excerpt, content, category, badge_text, badge_color, image_url, published } = req.body;

  try {
    const result = await pool.query(
      `UPDATE news SET title=$1,excerpt=$2,content=$3,category=$4,badge_text=$5,
       badge_color=$6,image_url=$7,published=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [title, excerpt, content, category, badge_text, badge_color, image_url, published, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/news/:id — admin
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;