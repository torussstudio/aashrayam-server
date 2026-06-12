require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');
const { validateEnv } = require('./config/env');

const app = express();

const { env, missing } = validateEnv();
if (missing.length) {
  console.warn(`Missing environment variables: ${missing.join(', ')}`);
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  env.clientUrl,
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/news',         require('./routes/news'));
app.use('/api/events',       require('./routes/events'));
app.use('/api/programs',     require('./routes/programs'));
app.use('/api/gallery',      require('./routes/gallery'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/resources',    require('./routes/resources'));

app.get('/health', async (req, res) => {
  if (!env.databaseUrl) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'SUPABASE_DB_URL environment variable is not set.',
      hint: 'Add SUPABASE_DB_URL in your environment.'
    });
  }
  try {
    await initDB();
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Aashrayam API v1.0' });
});

app.use((err, req, res, next) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

const PORT = env.port || 4000;
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (!env.databaseUrl) {
  console.warn('Server started without DB connection. Set SUPABASE_DB_URL to enable data routes.');
  startServer();
} else {
  initDB()
    .then(startServer)
    .catch(err => {
      console.error('Failed to initialize DB, server started in degraded mode:', err.message);
      startServer();
    });
}

module.exports = app;