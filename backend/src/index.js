import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, db } from './lib/json-db.js';
import { ensureDemoData } from './lib/seed.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve('../frontend/dist')));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const RUNNER_URL = process.env.RUNNER_URL || 'http://localhost:5001';
const SUBMISSIONS_DIR = process.env.SUBMISSIONS_DIR || path.resolve('./data/submissions');
const RESULTS_DIR = process.env.RESULTS_DIR || path.resolve('./data/results');

fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });
fs.mkdirSync(RESULTS_DIR, { recursive: true });

// Auth middleware
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Multer setup for zip uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SUBMISSIONS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Helper to register routes at both base and /api prefixes
function route(method, path, ...handlers) {
  app[method](path, ...handlers);
  app[method]('/api' + path, ...handlers);
}

// Routes
route('get', '/api', (req, res) => {
  res.json({ 
    service: 'ACA Backend API', 
    status: 'running',
    version: '0.1.0',
    endpoints: {
      auth: '/auth/register, /auth/login',
      assignments: '/assignments',
      submissions: '/submissions'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'backend' });
});

route('post', '/auth/register', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)')
      .run(email, password, role === 'teacher' ? 'teacher' : 'student');
  } catch (e) {
    return res.status(400).json({ error: 'User exists?' });
  }
  return res.json({ ok: true });
});

route('post', '/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT id, email, role FROM users WHERE email = ? AND password = ?')
    .get(email, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token });
});

route('get', '/assignments', authRequired, (req, res) => {
  const rows = db.prepare('SELECT id, slug, title, language FROM assignments').all();
  res.json(rows);
});

route('post', '/submissions', authRequired, upload.single('file'), (req, res) => {
  const { assignmentId } = req.body || {};
  if (!assignmentId || !req.file) return res.status(400).json({ error: 'Missing assignmentId or file' });

  const stmt = db.prepare('INSERT INTO submissions (userId, assignmentId, filename, status, createdAt) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, assignmentId, req.file.filename, 'queued', Date.now());
  const submissionId = info.lastInsertRowid;

  // trigger runner
  fetch(`${RUNNER_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId, assignmentId, filename: req.file.filename })
  }).catch(() => {});

  res.json({ submissionId });
});

route('get', '/submissions/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  const result = db.prepare('SELECT * FROM results WHERE submissionId = ?').get(id);
  res.json({ submission: sub, result });
});

// Runner callback to store results
route('post', '/runner/callback', express.json(), (req, res) => {
  const { submissionId, status, score, totalTests, passedTests, feedback } = req.body || {};
  if (!submissionId) return res.status(400).json({ error: 'Missing submissionId' });

  const tx = db.transaction((payload) => {
    db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status || 'completed', submissionId);
    db.prepare('INSERT INTO results (submissionId, score, totalTests, passedTests, feedback, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(submissionId, score || 0, totalTests || 0, passedTests || 0, feedback || '', Date.now());
  });
  tx(req.body);
  res.json({ ok: true });
});

// Serve React app for UI routes (everything except API and uploads)
app.get(['/', '/login', '/register', '/dashboard', '/assignments', '/submissions', '/teacher', '/teacher/assignments', '/teacher/analytics'], (req, res) => {
  const indexPath = path.resolve('../frontend/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      service: 'ACA Backend API',
      status: 'running',
      note: 'Frontend not built yet. Run \'cd frontend && npm install && npm run build\''
    });
  }
});

// Start
initDb();
ensureDemoData();
app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
  console.log(`Frontend will be served from :${PORT}`);
});



