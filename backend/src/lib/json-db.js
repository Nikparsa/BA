import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = process.env.DB_FILE || path.resolve('./data/db.json');

class JsonDB {
  constructor() {
    this.data = {
      users: [],
      assignments: [],
      submissions: [],
      results: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading database:', error);
      this.data = {
        users: [],
        assignments: [],
        submissions: [],
        results: []
      };
    }
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // User operations
  createUser(email, password, role) {
    const existingUser = this.data.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const user = {
      id: this.data.users.length + 1,
      email,
      password,
      role: role || 'student'
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  getUserByEmail(email) {
    return this.data.users.find(u => u.email === email);
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  // Assignment operations
  createAssignment(slug, title, language) {
    const existingAssignment = this.data.assignments.find(a => a.slug === slug);
    if (existingAssignment) {
      throw new Error('Assignment already exists');
    }
    
    const assignment = {
      id: this.data.assignments.length + 1,
      slug,
      title,
      language
    };
    this.data.assignments.push(assignment);
    this.save();
    return assignment;
  }

  getAllAssignments() {
    return this.data.assignments;
  }

  getAssignmentById(id) {
    return this.data.assignments.find(a => a.id === id);
  }

  getAssignmentBySlug(slug) {
    return this.data.assignments.find(a => a.slug === slug);
  }

  // Submission operations
  createSubmission(userId, assignmentId, filename, status = 'queued') {
    const submission = {
      id: this.data.submissions.length + 1,
      userId,
      assignmentId,
      filename,
      status,
      createdAt: Date.now()
    };
    this.data.submissions.push(submission);
    this.save();
    return submission;
  }

  getSubmissionById(id) {
    return this.data.submissions.find(s => s.id === id);
  }

  updateSubmissionStatus(id, status) {
    const submission = this.data.submissions.find(s => s.id === id);
    if (submission) {
      submission.status = status;
      this.save();
    }
    return submission;
  }

  // Result operations
  createResult(submissionId, score, totalTests, passedTests, feedback = '') {
    const result = {
      id: this.data.results.length + 1,
      submissionId,
      score,
      totalTests,
      passedTests,
      feedback,
      createdAt: Date.now()
    };
    this.data.results.push(result);
    this.save();
    return result;
  }

  getResultBySubmissionId(submissionId) {
    return this.data.results.find(r => r.submissionId === submissionId);
  }

  // Initialize with sample data
  ensureSampleData() {
    if (this.data.assignments.length === 0) {
      this.createAssignment('fizzbuzz', 'FizzBuzz', 'python');
      this.createAssignment('csv-stats', 'CSV Statistics', 'python');
      this.createAssignment('vector2d', '2D Vector Operations', 'python');
    }
  }
}

let jsonDb;

export function initDb() {
  jsonDb = new JsonDB();
  jsonDb.ensureSampleData();
}

export function getDb() {
  if (!jsonDb) {
    initDb();
  }
  return jsonDb;
}

// For backward compatibility
export const db = {
  prepare: (sql) => {
    const db = getDb();
    return {
      run: (...params) => {
        // Parse SQL and execute appropriate operation
        const sqlLower = sql.toLowerCase().trim();
        
        if (sqlLower.includes('insert into users')) {
          const email = params[0];
          const password = params[1];
          const role = params[2];
          try {
            const user = db.createUser(email, password, role);
            return { lastInsertRowid: user.id };
          } catch (error) {
            throw error;
          }
        }
        
        if (sqlLower.includes('select') && sqlLower.includes('from users') && sqlLower.includes('where')) {
          const email = params[0];
          const password = params[1];
          const user = db.getUserByEmail(email);
          if (user && user.password === password) {
            return user;
          }
          return null;
        }
        
        if (sqlLower.includes('insert into submissions')) {
          const userId = params[0];
          const assignmentId = params[1];
          const filename = params[2];
          const status = params[3];
          const createdAt = params[4];
          const submission = db.createSubmission(userId, assignmentId, filename, status);
          return { lastInsertRowid: submission.id };
        }
        
        if (sqlLower.includes('select') && sqlLower.includes('from submissions') && sqlLower.includes('where id')) {
          const id = params[0];
          return db.getSubmissionById(id);
        }
        
        if (sqlLower.includes('update submissions set status')) {
          const status = params[0];
          const id = params[1];
          db.updateSubmissionStatus(id, status);
          return { changes: 1 };
        }
        
        if (sqlLower.includes('insert into results')) {
          const submissionId = params[0];
          const score = params[1];
          const totalTests = params[2];
          const passedTests = params[3];
          const feedback = params[4];
          const createdAt = params[5];
          const result = db.createResult(submissionId, score, totalTests, passedTests, feedback);
          return { lastInsertRowid: result.id };
        }
        
        if (sqlLower.includes('select') && sqlLower.includes('from results') && sqlLower.includes('where submissionid')) {
          const submissionId = params[0];
          return db.getResultBySubmissionId(submissionId);
        }
        
        if (sqlLower.includes('select') && sqlLower.includes('from assignments')) {
          return db.getAllAssignments();
        }
        
        return { changes: 0 };
      },
      get: (...params) => {
        return this.run(...params);
      },
      all: () => {
        const sqlLower = sql.toLowerCase().trim();
        if (sqlLower.includes('select') && sqlLower.includes('from assignments')) {
          return db.getAllAssignments();
        }
        return [];
      }
    };
  },
  
  transaction: (callback) => {
    const db = getDb();
    return callback;
  }
};
