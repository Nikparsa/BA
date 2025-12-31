# Automated Code Assessment System (ACA)

A **language-agnostic** educational platform for automated programming assignment grading with a focus on **easy extensibility**.

## 🎯 Core Philosophy

**Python is the example, extensibility is the goal.** The system uses Python as the working demonstration, but the architecture is designed to easily support any programming language with minimal changes.

## ✨ Features

- ✅ **Multi-language Architecture** - Plugin-based system ready for easy extension
- ✅ **Python Implementation** - Working example with pytest integration
- ✅ **Student Dashboard** - Assignment submission and progress tracking
- ✅ **Teacher Analytics** - Results monitoring and export functionality
- ✅ **Real-time Testing** - Automated test execution with instant feedback
- ✅ **Language Detection** - Automatic detection from submitted files

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Runner VM     │
│   (React)       │◄──►│  (Node.js)      │◄──►│  (Multi-lang)   │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - API Gateway   │    │ - Python Plugin │
│ - Upload UI     │    │ - Auth          │    │ - [Future Lang] │
│ - Analytics     │    │ - Database      │    │ - Extensible    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- (Optional) Docker for containerized deployment

### Development Mode
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../runner
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt  # On macOS/Linux use source .venv/bin/activate

# 2. Start all services (3 terminals)
# Terminal 1 - Backend
cd backend && node src/index.js

# Terminal 2 - Runner  
cd runner && .\.venv\Scripts\python.exe run.py   # or source .venv/bin/activate && python run.py

# Terminal 3 - Frontend
cd frontend && npm run dev
```

### Or use the startup script:
```powershell
.\start-project.ps1   # Automatically creates/uses runner .venv
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Runner API**: http://localhost:5001/health

## 📋 Sample Assignments

Three representative programming tasks are included:

1. **FizzBuzz+** - Simple function with edge cases
2. **CSV Statistics** - Data processing and analysis  
3. **Vector2D Class** - Object-oriented programming

## 🔧 Adding New Languages

The system is designed for **easy language extension**:

### 1. Create Language Plugin
```python
# runner/language_plugins/new_language_plugin.py
from .base_plugin import LanguagePlugin

class NewLanguagePlugin(LanguagePlugin):
    def __init__(self):
        super().__init__('newlanguage', {
            'extensions': ['.ext'],
            'testFramework': 'framework',
            'timeout': 90
        })
    
    def detect_language(self, files):
        return any(f.endswith('.ext') for f in files)
    
    # ... implement other required methods
```

### 2. Register Plugin
```python
# runner/language_plugins/plugin_manager.py
plugin_registry = {
    'python': 'python_plugin.PythonPlugin',
    'newlanguage': 'new_language_plugin.NewLanguagePlugin',  # Add this line
}
```

### 3. Update Configuration
```javascript
// backend/src/lib/language-detector.js
const LANGUAGE_CONFIGS = {
  python: { extensions: ['.py'], ... },
  newlanguage: { extensions: ['.ext'], ... },  // Add this line
};
```

**That's it!** The new language is now supported.

## 🛠️ Technology Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite/JSON
- **Runner**: Python + Flask + pytest
- **Database**: JSON-based (development) / SQLite (production)
- **Deployment**: Docker + Docker Compose

## 📊 Language Support Status

| Language | Status | Test Framework | Ready for Extension |
|----------|--------|----------------|-------------------|
| Python | ✅ Implemented | pytest | Yes |
| Java | 🔄 Ready | JUnit | Add plugin |
| JavaScript | 🔄 Ready | Jest | Add plugin |
| Kotlin | 🔄 Ready | Kotest | Add plugin |
| Swift | 🔄 Ready | XCTest | Add plugin |
| Go | 🔄 Ready | testing | Add plugin |
| Ruby | 🔄 Ready | RSpec | Add plugin |

## 🔒 Security Features

- JWT-based authentication
- Container sandbox isolation
- File upload restrictions
- No network access in test environment
- Resource limits (CPU/memory/timeout)

## 📈 API Endpoints

### Backend (`/api`)
- `GET /languages` - Supported languages
- `POST /auth/login` - User authentication
- `GET /assignments` - List assignments
- `POST /submissions` - Submit code
- `GET /submissions/:id` - Get submission results

### Runner (`/`)
- `GET /health` - Service health check
- `GET /languages` - Runner capabilities
- `POST /run` - Execute tests

## 🐳 Docker Deployment

```bash
# Full containerized deployment
docker compose up --build

# Access at http://localhost:3000
```

## 🚀 Production Deployment

### Server Requirements
- Node.js 18+
- Python 3.9+
- npm
- (Optional) Docker and Docker Compose

### Environment Variables

The application uses environment variables for configuration:

**Backend** (`backend/src/index.js`):
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens (default: 'dev_secret_key')
- `RUNNER_URL` - Runner service URL (default: 'http://localhost:5001')
- `HOST` - Server host (default: '0.0.0.0')

**Frontend** (`frontend/src/App.jsx`):
- `VITE_API_BASE_URL` - Backend API URL (default: 'http://localhost:3000/api')

**Runner** (`runner/runner.py`):
- `PORT` - Runner port (default: 5001)
- `BACKEND_URL` - Backend API URL (default: 'http://localhost:3000/api')

### Deployment Steps

#### 1. Transfer Project to Server
```bash
# Using SCP
scp -r /path/to/project student@server:/home/student/

# Or using Git
git clone <repository-url>
cd <project-directory>
```

#### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Runner
cd ../runner
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. Build Frontend
```bash
cd frontend
npm run build
```

#### 4. Configure Environment Variables

Create a `.env` file in the project root or set environment variables:

```bash
# Backend environment
export PORT=3000
export JWT_SECRET=your_secure_secret_key_here
export RUNNER_URL=http://localhost:5001
export HOST=0.0.0.0

# Runner environment
export BACKEND_URL=http://localhost:3000/api
export PORT=5001

# Frontend build-time variable (set before building)
export VITE_API_BASE_URL=http://your-server-ip:3000/api
```

#### 5. Start Services

**Option A: One-Command Start (Recommended)**
```bash
# Make scripts executable
chmod +x start-server.sh stop-server.sh

# Start all services with one command
./start-server.sh

# Stop all services
./stop-server.sh
```

This script will:
- Check prerequisites (Node.js, Python)
- Install all dependencies
- Build the frontend
- Start backend and runner in background
- Show service URLs and log locations

**Option B: Manual Start (3 terminals)**
```bash
# Terminal 1 - Backend
cd backend
PORT=3000 JWT_SECRET=your_secret RUNNER_URL=http://localhost:5001 node src/index.js

# Terminal 2 - Runner
cd runner
source .venv/bin/activate
BACKEND_URL=http://localhost:3000/api PORT=5001 python run.py

# Terminal 3 - Frontend (served by backend, no separate process needed)
# The built frontend is served from backend/src/index.js
```

**Option B: Using PM2 (Recommended)**
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/index.js --name aca-backend --env PORT=3000,JWT_SECRET=your_secret,RUNNER_URL=http://localhost:5001

# Start runner
cd ../runner
source .venv/bin/activate
pm2 start run.py --name aca-runner --interpreter python3 --env BACKEND_URL=http://localhost:3000/api,PORT=5001

# Save PM2 configuration
pm2 save
pm2 startup
```

**Option C: Using Docker Compose**
```bash
# Create .env file with production values
cat > .env << EOF
PORT=3000
JWT_SECRET=your_secure_secret_key
RUNNER_URL=http://runner:5001
BACKEND_URL=http://backend:3000/api
VITE_API_BASE_URL=http://your-server-ip:3000/api
EOF

# Build and start
docker compose up -d --build
```

#### 6. Configure Firewall
```bash
# Allow HTTP traffic (if needed)
sudo ufw allow 3000/tcp
sudo ufw allow 5001/tcp
```

#### 7. Access Application
- **Frontend**: http://your-server-ip:3000
- **Backend API**: http://your-server-ip:3000/api
- **Runner API**: http://your-server-ip:5001/health

### Using Nginx as Reverse Proxy (Optional)

For production, consider using Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Troubleshooting

- **Port already in use**: Change PORT environment variable or stop conflicting services
- **Runner connection failed**: Verify RUNNER_URL matches runner's actual address
- **Frontend API errors**: Ensure VITE_API_BASE_URL is set correctly before building
- **Permission errors**: Check file permissions for data directories

## 🧪 Testing the System

1. **Register** a new account
2. **Login** with your credentials
3. **View Assignments** - See available programming tasks
4. **Submit Code** - Upload a ZIP file with your solution
5. **View Results** - See test results and feedback

## 📚 Research Context

This project is developed as part of a Bachelor's thesis research project focusing on:
- Impact of automated feedback on learning outcomes
- Multi-language programming education
- Best practices for automated code assessment

## 🤝 Contributing

This is a research prototype. The codebase is designed to be:
- **Clean** - Minimal, focused implementation
- **Extensible** - Easy to add new features
- **Educational** - Clear examples for learning

---

**Note**: This system demonstrates language-agnostic architecture where Python serves as the working example, but the foundation is built for easy extension to support any programming language.