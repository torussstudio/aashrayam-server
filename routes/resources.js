const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM resources WHERE published = true';
    const params = [];
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    query += ' ORDER BY sort_order ASC, created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources ORDER BY sort_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, category, subject, year, file_url, file_name, file_size, file_type, published, sort_order } = req.body;
  if (!title || !file_url) return res.status(400).json({ error: 'Title and file_url are required.' });
  try {
    const result = await pool.query(
      `INSERT INTO resources(title,description,category,subject,year,file_url,file_name,file_size,file_type,published,sort_order)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, description||null, category||'General', subject||null, year||null, file_url, file_name||null, file_size||null, file_type||null, published!==false, sort_order||0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, category, subject, year, file_url, file_name, file_size, file_type, published, sort_order } = req.body;
  if (!title || !file_url) return res.status(400).json({ error: 'Title and file_url are required.' });
  try {
    const result = await pool.query(
      `UPDATE resources SET title=$1,description=$2,category=$3,subject=$4,year=$5,file_url=$6,file_name=$7,file_size=$8,file_type=$9,published=$10,sort_order=$11,updated_at=NOW() WHERE id=$12 RETURNING *`,
      [title, description, category, subject, year, file_url, file_name, file_size, file_type, published, sort_order, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM resources WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;