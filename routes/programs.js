const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

// ── GET public programs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM programs WHERE published = true ORDER BY sort_order ASC, created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Programs GET error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ── GET all (admin)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM programs ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Programs GET /all error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Helper – coerce any value to a clean string array
const toArray = (val) => {
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(Boolean);
  if (val) return [String(val).trim()];
  return [];
};

router.post('/', authMiddleware, async (req, res) => {
  let { title, description, duration, icon, color, features, published, sort_order } = req.body;

  // Also accept the extended fields sent by the frontend – they are stored
  // only when the migration below has been applied.
  let { normal_fee, addon_fee, addon_courses, seats, tags } = req.body;

  features     = toArray(features);
  addon_courses = toArray(addon_courses);
  tags         = toArray(tags);

  if (!title) {
    return res.status(400).json({ error: 'title is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO programs(title, description, duration, icon, color, features,
         normal_fee, addon_fee, addon_courses, seats, tags, published, sort_order)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        title, description, duration, icon,
        color || '#2D7D6F', features,
        normal_fee || null,
        addon_fee || null,
        addon_courses,
        seats || null,
        tags,
        published !== false,
        sort_order || 0
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Programs POST error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ── PUT update program
router.put('/:id', authMiddleware, async (req, res) => {
  let { title, description, duration, icon, color, features, published, sort_order } = req.body;
  let { normal_fee, addon_fee, addon_courses, seats, tags } = req.body;

  features      = toArray(features);
  addon_courses = toArray(addon_courses);
  tags          = toArray(tags);

  try {
    const result = await pool.query(
      `UPDATE programs
       SET title=$1, description=$2, duration=$3, icon=$4, color=$5,
           features=$6, normal_fee=$7, addon_fee=$8, addon_courses=$9,
           seats=$10, tags=$11, published=$12, sort_order=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      // AFTER
      [title, description, duration, icon, color || '#2D7D6F',
       features, normal_fee, addon_fee, addon_courses,
       seats, tags, published, sort_order, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Programs PUT error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ── DELETE program
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM programs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Programs DELETE error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;