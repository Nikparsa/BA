const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { detectLanguage, getLanguageConfig, getSupportedLanguages } = require('./lib/language-detector.js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const RUNNER_URL = process.env.RUNNER_URL || 'http://localhost:5001';

// Middleware
app.use(cors());
app.use(express.json());
// Frontend path - __dirname is backend/src, so go up two levels to project root
const projectRoot = path.resolve(__dirname, '../..');
const frontendDistPath = path.join(projectRoot, 'frontend', 'dist');
console.log('Serving frontend from:', frontendDistPath);
console.log('Frontend dist exists:', fs.existsSync(frontendDistPath));
console.log('Frontend index.html exists:', fs.existsSync(path.join(frontendDistPath, 'index.html')));
app.use(express.static(frontendDistPath));

// Create data directories
const dataDir = path.join(__dirname, 'data');
const submissionsDir = path.join(dataDir, 'submissions');
const resultsDir = path.join(dataDir, 'results');
const customTasksDir = path.join(dataDir, 'tests');
const dbPath = path.join(dataDir, 'database.json');

for (const dir of [dataDir, submissionsDir, resultsDir, customTasksDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

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

function ensureAssignmentMetadata() {
  let mutated = false;
  database.assignments = (database.assignments || []).map((assignment) => {
    if (!assignment.origin) {
      mutated = true;
      return { ...assignment, origin: 'builtin' };
    }
    return assignment;
  });
  if (mutated) {
    saveDatabase();
  }
}

ensureAssignmentMetadata();

function createDefaultDatabase() {
  return {
    users: [
      { id: 1, email: 'student@test.com', password: '123456', role: 'student' },
      { id: 2, email: 'teacher@test.com', password: '123456', role: 'teacher' }
    ],
    assignments: [
      { id: 1, title: 'FizzBuzz', slug: 'fizzbuzz', description: 'Write a FizzBuzz function', origin: 'builtin' },
      { id: 2, title: 'CSV Statistics', slug: 'csv-stats', description: 'Process CSV data', origin: 'builtin' },
      { id: 3, title: 'Vector2D', slug: 'vector2d', description: '2D Vector operations', origin: 'builtin' }
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

function teacherOnly(req, res, next) {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ error: 'Teacher permissions required' });
  }
  next();
}

function normalizeDetails(details) {
  if (!details) return [];
  if (Array.isArray(details)) {
    return details
      .map((detail) => (typeof detail === 'string' ? detail.trim() : ''))
      .filter(Boolean);
  }
  if (typeof details === 'string') {
    return details
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

function toTitleCase(slug = '') {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
    .trim();
}

function sanitizeSlug(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Multer for file uploads
// (Uploaded files are automatically renamed with a timestamp prefix 
// to ensure unique filenames and prevent conflicts.)
const storage = multer.diskStorage({
  destination: submissionsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });
const teacherTestsUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

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

app.post('/api/assignments', authRequired, teacherOnly, teacherTestsUpload.single('testFile'), (req, res) => {
  const { title, slug, description = '', details } = req.body || {};

  if (!title || !slug) {
    return res.status(400).json({ error: 'Title and slug are required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Test file is required' });
  }

  const normalizedSlug = sanitizeSlug(slug);
  if (!normalizedSlug) {
    return res.status(400).json({ error: 'Invalid slug. Use alphanumeric characters and hyphens only.' });
  }

  if (database.assignments.some((assignment) => assignment.slug === normalizedSlug)) {
    return res.status(400).json({ error: 'An assignment with this slug already exists.' });
  }

  const assignmentDir = path.join(customTasksDir, normalizedSlug);
  const assignmentTestsDir = path.join(assignmentDir, 'tests');
  fs.mkdirSync(assignmentTestsDir, { recursive: true });

  const originalName = (req.file.originalname || 'tests.py').replace(/[^\w.\-]/g, '_');
  const filename = originalName.endsWith('.py') ? originalName : `${originalName}.py`;
  const destination = path.join(assignmentTestsDir, filename);
  fs.writeFileSync(destination, req.file.buffer);

  const nextId = database.assignments.reduce((max, assignment) => Math.max(max, assignment.id), 0) + 1;
  const newAssignment = {
    id: nextId,
    title: title.trim(),
    slug: normalizedSlug,
    description: description.trim(),
    details: normalizeDetails(details),
    origin: 'custom',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  database.assignments.push(newAssignment);
  saveDatabase();

  res.status(201).json(newAssignment);
});

app.put('/api/assignments/:id', authRequired, teacherOnly, (req, res) => {
  const assignmentId = parseInt(req.params.id);
  const assignment = database.assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const { title, description, details } = req.body || {};

  if (title) assignment.title = title.trim();
  if (description !== undefined) assignment.description = description.trim();
  if (details !== undefined) assignment.details = normalizeDetails(details);

  saveDatabase();
  res.json(assignment);
});

app.delete('/api/assignments/:id', authRequired, teacherOnly, (req, res) => {
  const assignmentId = parseInt(req.params.id);
  const assignmentIndex = database.assignments.findIndex((assignment) => assignment.id === assignmentId);

  if (assignmentIndex === -1) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const [removedAssignment] = database.assignments.splice(assignmentIndex, 1);

  if (removedAssignment?.origin === 'custom') {
    const customDir = path.join(customTasksDir, removedAssignment.slug);
    if (fs.existsSync(customDir)) {
      fs.rmSync(customDir, { recursive: true, force: true });
    }
  }

  saveDatabase();
  res.json({ ok: true });
});

// Submission routes
app.post('/api/submissions', authRequired, upload.single('file'), (req, res) => {
  const { assignmentId } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Check submission limit: maximum 2 submissions per assignment per student
  const userSubmissions = database.submissions.filter(
    s => s.userId === req.user.id && s.assignmentId === parseInt(assignmentId)
  );
  
  if (userSubmissions.length >= 2) {
    return res.status(400).json({ 
      error: 'Maximum submission limit reached. You can only submit 2 times per assignment.' 
    });
  }

 // Creates a new submission record with auto-incremented ID.
// The submission ID is generated by adding 1 to the current number of submissions
// in the database, ensuring sequential numbering (e.g., #1, #2, #3...).
// The submission is immediately added to the database and saved to disk.
// Status is set to 'queued' until the runner processes it.
  
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
  fetch(`${RUNNER_URL}/run`, {
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

// Get all submissions for current user (or all submissions for teachers)
app.get('/api/submissions', authRequired, (req, res) => {
  // Teachers can see all submissions, students only their own
  const submissionsToReturn = req.user.role === 'teacher'
    ? database.submissions
    : database.submissions.filter(s => s.userId === req.user.id);
  
    // add each user email to database.users  
  const enrichedSubmissions = submissionsToReturn
    .map(submission => {
      const result = database.results.find(r => r.submissionId === submission.id);
      const user = database.users.find(u => u.id === submission.userId);
      return {
        ...submission,
        score: result?.score,
        totalTests: result?.totalTests,
        passedTests: result?.passedTests,
        feedback: result?.feedback,
        // Include user email for teachers
        userEmail: user?.email || 'Unknown'
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first
  
  res.json(enrichedSubmissions);
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

// Serve React app - handle root and all other routes
app.get('/', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  res.sendFile(indexPath);
});

app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  console.log('Catch-all route - serving index.html from:', indexPath);
  res.sendFile(indexPath);
});

// Start server
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
  console.log(`API available at http://${HOST}:${PORT}/api`);
});
