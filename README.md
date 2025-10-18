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
cd ../runner && pip install flask requests pytest pytest-json-report

# 2. Start all services (3 terminals)
# Terminal 1 - Backend
cd backend && node src/index.js

# Terminal 2 - Runner  
cd runner && python run.py

# Terminal 3 - Frontend
cd frontend && npm run dev
```

### Or use the startup script:
```powershell
.\start-project.ps1
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