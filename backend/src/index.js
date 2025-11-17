const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { detectLanguage, getLanguageConfig, getSupportedLanguages } = require('./lib/language-detector.js');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'dev_secret_key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Create data directories
const dataDir = path.join(__dirname, 'data');
const submissionsDir = path.join(dataDir, 'submissions');
const resultsDir = path.join(dataDir, 'results');
const dbPath = path.join(dataDir, 'database.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(submissionsDir)) fs.mkdirSync(submissionsDir);
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

// Load database from file or create default
let database;
if (fs.existsSync(dbPath)) {
  try {
    database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log('Database loaded from file');
  } catch (error) {
    console.error('Error loading database:', error);
    database = createDefaultDatabase();
  }
} else {
  database = createDefaultDatabase();
  saveDatabase();
}

function createDefaultDatabase() {
  return {
    users: [
      { id: 1, email: 'student@test.com', password: '123456', role: 'student' },
      { id: 2, email: 'teacher@test.com', password: '123456', role: 'teacher' }
    ],
    assignments: [
      { id: 1, title: 'FizzBuzz', slug: 'fizzbuzz', description: 'Write a FizzBuzz function' },
      { id: 2, title: 'CSV Statistics', slug: 'csv-stats', description: 'Process CSV data' },
      { id: 3, title: 'Vector2D', slug: 'vector2d', description: '2D Vector operations' }
    ],
    submissions: [],
    results: []
  };
}

function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Auth middleware
function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Multer for file uploads
const storage = multer.diskStorage({
  destination: submissionsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes
app.get('/api', (req, res) => {
  res.json({ 
    service: 'ACA Backend API', 
    status: 'running',
    version: '1.0.0'
  });
});

// Get supported languages
app.get('/api/languages', (req, res) => {
  res.json({
    supported_languages: getSupportedLanguages(),
    language_configs: getSupportedLanguages().reduce((configs, lang) => {
      configs[lang] = getLanguageConfig(lang);
      return configs;
    }, {})
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = database.users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
  
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, role = 'student' } = req.body;
  
  if (database.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const user = {
    id: database.users.length + 1,
    email,
    password,
    role
  };
  
  database.users.push(user);
  saveDatabase();
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
  
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// Assignment routes
app.get('/api/assignments', authRequired, (req, res) => {
  res.json(database.assignments);
});

// Public route for runner (no auth required)
app.get('/api/runner/assignments', (req, res) => {
  res.json(database.assignments);
});

// Submission routes
app.post('/api/submissions', authRequired, upload.single('file'), (req, res) => {
  const { assignmentId } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const submission = {
    id: database.submissions.length + 1,
    userId: req.user.id,
    assignmentId: parseInt(assignmentId),
    filename: req.file.filename,
    status: 'queued',
    createdAt: new Date().toISOString()
  };
  
  database.submissions.push(submission);
  saveDatabase();
  
  // Send to runner
  fetch('http://localhost:5001/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submissionId: submission.id,
      assignmentId: submission.assignmentId,
      filename: req.file.filename
    })
  }).catch(err => console.error('Runner error:', err));
  
  res.json({ 
    submissionId: submission.id,
    message: 'Submission queued for processing'
  });
});

// Get all submissions for current user
app.get('/api/submissions', authRequired, (req, res) => {
  const userSubmissions = database.submissions
    .filter(s => s.userId === req.user.id)
    .map(submission => {
      const result = database.results.find(r => r.submissionId === submission.id);
      return {
        ...submission,
        score: result?.score,
        totalTests: result?.totalTests,
        passedTests: result?.passedTests,
        feedback: result?.feedback
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first
  
  res.json(userSubmissions);
});

app.get('/api/submissions/:id', authRequired, (req, res) => {
  const submissionId = parseInt(req.params.id);
  const submission = database.submissions.find(s => s.id === submissionId);
  
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  const result = database.results.find(r => r.submissionId === submissionId);
  
  res.json({ submission, result });
});

// Runner callback
app.post('/api/runner/callback', (req, res) => {
  const { submissionId, status, score, totalTests, passedTests, feedback } = req.body;
  
  // Update submission status
  const submission = database.submissions.find(s => s.id === submissionId);
  if (submission) {
    submission.status = status;
  }
  
  // Create result
  const result = {
    id: database.results.length + 1,
    submissionId,
    score: score || 0,
    totalTests: totalTests || 0,
    passedTests: passedTests || 0,
    feedback: feedback || '',
    createdAt: new Date().toISOString()
  };
  
  database.results.push(result);
  saveDatabase();
  
  res.json({ ok: true });
});

// Serve React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'Frontend not built. Run: cd frontend && npm run build',
      api: 'Backend API is running at /api'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
