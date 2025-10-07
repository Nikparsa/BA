# Alternative Setup Without Docker Desktop

If Docker Desktop continues to have issues, here's how to run the project directly:

## Option 1: Run Services Locally

### Backend Setup
```powershell
cd backend
npm install
npm start
```

### Runner Setup (in another terminal)
```powershell
cd runner
pip install flask requests pytest pytest-json-report
python -m flask run --host=0.0.0.0 --port=5001
```

### Frontend Setup (in another terminal)
```powershell
cd frontend
# Use any simple HTTP server
python -m http.server 5173
# OR
npx serve . -p 5173
```

## Option 2: Use Docker Toolbox

1. Download Docker Toolbox from: https://github.com/docker/toolbox/releases
2. Install Docker Toolbox
3. Run the project with: `docker-compose up --build`

## Option 3: Virtual Machine

1. Install VirtualBox
2. Create a Linux VM
3. Install Docker in the VM
4. Run the project there

## Option 4: Cloud Development

Use online services like:
- GitHub Codespaces
- GitPod
- Replit

---

The easiest solution is usually to restart your computer and try Docker Desktop again.


