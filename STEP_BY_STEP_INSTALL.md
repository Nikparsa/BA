# 🚀 Step-by-Step Installation Guide

## Step 1: Install Docker Desktop

### 1.1 Download Docker Desktop
1. Open your web browser
2. Go to: https://www.docker.com/products/docker-desktop/
3. Click "Download for Windows"
4. Wait for download to complete (about 500MB)

### 1.2 Install Docker Desktop
1. Go to your Downloads folder
2. Right-click on `Docker Desktop Installer.exe`
3. Select "Run as administrator"
4. In the installer:
   - ✅ Check "I accept the terms"
   - ✅ Keep "Use WSL 2 instead of Hyper-V" checked
   - ✅ Keep "Add shortcut to desktop" checked
   - Click "OK"
5. Wait for installation (5-10 minutes)
6. When finished, click "Close and restart"
7. **RESTART YOUR COMPUTER**

## Step 2: Start Docker Desktop

### 2.1 After Computer Restart
1. Look for Docker Desktop icon on your desktop
2. Double-click to start Docker Desktop
3. **OR** go to Start Menu → Search "Docker Desktop" → Click it

### 2.2 Wait for Docker to Start
1. Look for the Docker whale icon in your system tray (bottom-right corner)
2. Wait until the whale icon is **solid** (not animated)
3. This takes 2-5 minutes on first startup

### 2.3 Verify Docker is Working
1. Open PowerShell (any directory)
2. Type: `docker --version`
3. You should see: `Docker version 20.x.x, build xxxxx`
4. Type: `docker ps`
5. You should see: `CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES`

**If you get errors, go back to Step 2.2 and wait longer for Docker to fully start.**

## Step 3: Run the Project

### 3.1 Navigate to Project Directory
1. Open PowerShell
2. Type: `cd C:\FH\BA_2`
3. Press Enter

### 3.2 Start the Application
1. Type: `docker compose up --build`
2. Press Enter
3. Wait for the build process (5-10 minutes)

**You'll see output like:**
```
[+] Building 15.2s (15/15) FINISHED
[+] Running 3/3
 ✔ Container aca-backend    Started
 ✔ Container aca-runner     Started  
 ✔ Container aca-frontend   Started
```

### 3.3 Access the Application
Once everything is running, open your web browser and go to:
- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:5173
- **Runner Service:** http://localhost:5001

## Step 4: Test the System

### 4.1 Test Backend
1. Open browser: http://localhost:3000
2. You should see some response (or error page - that's normal)

### 4.2 Test Runner
1. Open browser: http://localhost:5001/health
2. You should see: `{"ok": true}`

### 4.3 Test API (Optional)
Open PowerShell and run:
```powershell
# Test runner health
Invoke-WebRequest -Uri "http://localhost:5001/health"

# Register a test user
$body = @{
    email = "test@example.com"
    password = "password123"
    role = "student"
} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/auth/register" -Method POST -Body $body -ContentType "application/json"
```

## Step 5: Stop the Application

When you're done testing:
1. In PowerShell, press `Ctrl + C`
2. Type: `docker compose down`
3. Press Enter

## 🆘 Troubleshooting

### Problem: Docker Desktop won't start
**Solution:**
1. Right-click Docker Desktop icon in system tray
2. Select "Troubleshoot"
3. Follow the troubleshooting wizard
4. Or restart your computer

### Problem: "docker: command not found"
**Solution:**
1. Docker Desktop is not running
2. Go back to Step 2 and start Docker Desktop
3. Wait for the whale icon to be solid

### Problem: Build errors
**Solution:**
1. Stop the application: `Ctrl + C`
2. Clean Docker: `docker system prune -f`
3. Try again: `docker compose up --build`

### Problem: Port already in use
**Solution:**
1. Find what's using the port: `netstat -ano | findstr :3000`
2. Kill the process: `taskkill /PID <PID> /F`
3. Or change ports in docker-compose.yml

## 📋 Quick Commands Reference

```powershell
# Check Docker version
docker --version

# Check if Docker is running
docker ps

# Start the application
docker compose up --build

# Stop the application
docker compose down

# Clean Docker system
docker system prune -f

# View logs
docker compose logs -f
```

## ✅ Success Indicators

You'll know everything is working when:
- ✅ Docker Desktop whale icon is solid (not animated)
- ✅ `docker ps` shows no errors
- ✅ `docker compose up --build` completes without errors
- ✅ You can access http://localhost:5001/health
- ✅ You can access http://localhost:3000

## 🎯 Next Steps After Installation

Once everything is running:
1. **Explore the API** using the endpoints in PROJECT_EXPLANATION.md
2. **Create test submissions** for the available tasks
3. **Customize the system** by adding new tasks
4. **Develop new features** as needed

---

**Total time needed: 30-60 minutes (including download and installation)**

