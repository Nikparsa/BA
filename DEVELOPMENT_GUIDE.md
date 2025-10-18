# ACA Development Guide - Step by Step Implementation

This document explains how the ACA (Automated Code Assessment) system was built step by step, from scratch.

## 🏗️ Architecture Overview

The ACA system follows a **3-tier architecture**:
- **Frontend**: React web application for user interface
- **Backend**: Node.js API server for business logic and data management
- **Runner**: Python service for executing and testing submitted code

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Runner        │
│   (React)       │◄──►│  (Node.js)      │◄──►│  (Python)       │
│                 │    │                 │    │                 │
│ - Login/Register│    │ - Authentication│    │ - Code Testing  │
│ - Dashboard     │    │ - File Upload   │    │ - Pytest Runner │
│ - Submissions   │    │ - Database      │    │ - Results       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
BA_2/
├── backend/              # Node.js API Server
│   ├── package.json      # Dependencies and scripts
│   └── server.js         # Main server file
├── frontend/             # React Web Application
│   ├── package.json      # Dependencies and scripts
│   ├── vite.config.js    # Vite configuration
│   ├── index.html        # HTML template
│   └── src/
│       ├── main.jsx      # React entry point
│       ├── index.css     # Global styles
│       └── App.jsx       # Main React component
├── runner/               # Python Test Runner
│   ├── requirements.txt  # Python dependencies
│   └── runner.py         # Flask server for code execution
├── tasks/                # Sample Assignments
│   ├── fizzbuzz/
│   ├── csv-stats/
│   └── vector2d/
└── start.bat             # Windows startup script
```

## 🔧 Step-by-Step Implementation

### Step 1: Project Setup

**1.1 Create Directory Structure**
```bash
mkdir backend frontend runner tasks
```

**1.2 Initialize Each Component**
- Backend: Node.js project with Express framework
- Frontend: React project with Vite build tool
- Runner: Python project with Flask framework

### Step 2: Backend Development (Node.js + Express)

**2.1 Package Configuration (`backend/package.json`)**
```json
{
  "name": "aca-backend",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",      // Web framework
    "cors": "^2.8.5",          // Cross-origin requests
    "multer": "^1.4.5-lts.1",  // File upload handling
    "jsonwebtoken": "^9.0.2",  // Authentication tokens
    "uuid": "^9.0.1"           // Unique identifiers
  }
}
```

**2.2 Server Implementation (`backend/server.js`)**

**Core Features Implemented:**

1. **Express Server Setup**
```javascript
const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));
```

2. **In-Memory Database**
```javascript
let database = {
  users: [
    { id: 1, email: 'student@test.com', password: '123456', role: 'student' },
    { id: 2, email: 'teacher@test.com', password: '123456', role: 'teacher' }
  ],
  assignments: [
    { id: 1, title: 'FizzBuzz', slug: 'fizzbuzz', description: 'Write a FizzBuzz function' },
    // ... more assignments
  ],
  submissions: [],
  results: []
};
```

3. **Authentication Middleware**
```javascript
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
```

4. **File Upload Handling**
```javascript
const storage = multer.diskStorage({
  destination: submissionsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });
```

5. **API Endpoints**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/assignments` - List assignments
- `POST /api/submissions` - Submit code files
- `GET /api/submissions/:id` - Get submission results
- `POST /api/runner/callback` - Receive test results from runner

### Step 3: Frontend Development (React + Vite)

**3.1 Package Configuration (`frontend/package.json`)**
```json
{
  "name": "aca-frontend",
  "type": "module",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.1.1",
    "vite": "^5.0.0"
  }
}
```

**3.2 Vite Configuration (`frontend/vite.config.js`)**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'  // Proxy API calls to backend
    }
  }
})
```

**3.3 Main Application (`frontend/src/App.jsx`)**

**Key Components Implemented:**

1. **Authentication System**
```javascript
const login = async (email, password) => {
  try {
    const response = await axios.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setPage('dashboard');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Login failed' };
  }
};
```

2. **File Upload Component**
```javascript
const submitAssignment = async (assignmentId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', assignmentId);

    const response = await axios.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Submission failed' };
  }
};
```

3. **Page Components**
- `LoginPage` - User authentication
- `RegisterPage` - User registration
- `Dashboard` - Main overview
- `AssignmentsPage` - Assignment submission
- `SubmissionsPage` - View submission history
- `TeacherDashboard` - Teacher analytics

**3.4 Styling (`frontend/src/index.css`)**
- Clean, modern CSS with utility classes
- Responsive design
- Professional color scheme
- Form styling and button states

### Step 4: Runner Development (Python + Flask)

**4.1 Dependencies (`runner/requirements.txt`)**
```
flask==2.3.3           # Web framework
requests==2.31.0       # HTTP client
pytest==7.4.3          # Testing framework
pytest-json-report==1.5.0  # JSON test reports
```

**4.2 Runner Implementation (`runner/runner.py`)**

**Core Features:**

1. **Flask Server Setup**
```python
from flask import Flask, request, jsonify
import os
import zipfile
import tempfile
import subprocess
import json
import shutil
import requests

app = Flask(__name__)
PORT = 5000
```

2. **Pytest Execution Function**
```python
def run_pytest(workdir, test_dir):
    report_path = os.path.join(workdir, 'report.json')
    
    cmd = [
        'python', '-m', 'pytest',
        '-q',
        '--maxfail=1',
        '--disable-warnings',
        '--json-report',
        f'--json-report-file={report_path}',
        test_dir
    ]
    
    result = subprocess.run(cmd, cwd=workdir, capture_output=True, text=True, timeout=60)
    # Parse results and return structured data
```

3. **Main Execution Endpoint**
```python
@app.route('/run', methods=['POST'])
def run():
    payload = request.get_json(force=True)
    submission_id = payload.get('submissionId')
    assignment_id = payload.get('assignmentId')
    filename = payload.get('filename')
    
    # Extract submitted files
    # Copy test files
    # Run pytest
    # Send results back to backend
```

**4.3 Test Processing Workflow**
1. Receive submission request from backend
2. Extract ZIP file containing student's code
3. Copy test files to working directory
4. Execute pytest with JSON reporting
5. Parse test results and generate feedback
6. Send results back to backend via callback

### Step 5: Sample Assignments and Tests

**5.1 FizzBuzz Assignment (`tasks/fizzbuzz/tests/test_fizzbuzz.py`)**
```python
def load_solution():
    # Dynamically import student's solution
    spec = importlib.util.spec_from_file_location('solution', 'solution.py')
    mod = importlib.util.module_from_spec(spec)
    sys.modules['solution'] = mod
    spec.loader.exec_module(mod)
    return mod

def test_basic():
    s = load_solution()
    assert s.fizzbuzz(1) == '1'
    assert s.fizzbuzz(3) == 'Fizz'
    assert s.fizzbuzz(5) == 'Buzz'
    assert s.fizzbuzz(15) == 'FizzBuzz'
```

**5.2 CSV Statistics Assignment**
- Tests for mean, median, standard deviation calculations
- Edge case handling for empty data

**5.3 Vector2D Assignment**
- Object-oriented programming tests
- Vector operations (addition, multiplication, dot product)

### Step 6: Startup Scripts

**6.1 Windows Batch Script (`start.bat`)**
```batch
@echo off
echo ========================================
echo    ACA - Automated Code Assessment
echo ========================================

REM Check prerequisites
node --version >nul 2>&1
python --version >nul 2>&1

REM Install dependencies
cd backend && npm install
cd ../frontend && npm install && npm run build
cd ../runner && pip install -r requirements.txt

REM Start services
start "ACA Backend" cmd /k "cd backend && node server.js"
start "ACA Runner" cmd /k "cd runner && python runner.py"
```

**6.2 PowerShell Script (`start.ps1`)**
- Same functionality with PowerShell syntax
- Better error handling and colored output

## 🔄 Data Flow

1. **User Registration/Login**
   ```
   User → Frontend → Backend → JWT Token → Frontend
   ```

2. **Assignment Submission**
   ```
   User → Frontend → Backend → File Storage → Runner → Test Execution → Results → Backend → Frontend
   ```

3. **Test Execution Process**
   ```
   Backend sends submission → Runner extracts files → Copies tests → Runs pytest → Parses results → Sends callback → Backend stores results
   ```

## 🛠️ Development Principles

1. **Simplicity First**: No complex frameworks or unnecessary dependencies
2. **Clear Separation**: Each component has a single responsibility
3. **Easy Deployment**: No Docker complexity, direct execution
4. **Error Handling**: Comprehensive error messages and fallbacks
5. **Security**: JWT authentication, file validation
6. **Extensibility**: Easy to add new assignments and languages

## 🚀 Deployment

The system is designed for easy deployment:

1. **Prerequisites**: Node.js 18+, Python 3.9+
2. **Installation**: Run `start.bat` or `start.ps1`
3. **Access**: Open http://localhost:3000
4. **Testing**: Use provided sample solutions

## 📊 Key Features Implemented

- ✅ User authentication and authorization
- ✅ File upload and processing
- ✅ Automated code testing
- ✅ Real-time result display
- ✅ Teacher dashboard
- ✅ Clean, responsive UI
- ✅ Error handling and validation
- ✅ One-click startup

This implementation provides a solid foundation for an automated code assessment system that can be easily extended and maintained.
