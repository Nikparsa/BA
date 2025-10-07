# Setup Guide - Automated Code Assessment System

## Prerequisites

Before running the setup, you need to install the required software.

### 1. Install Docker Desktop

Since this project uses Docker containers, you need to install Docker Desktop for Windows.

#### Download and Install Docker Desktop:

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Windows
   - Choose the appropriate version (Windows 10/11)

2. **Installation Steps:**
   - Run the installer as Administrator
   - Follow the installation wizard
   - Enable WSL 2 integration when prompted (recommended)
   - Restart your computer when installation completes

3. **Verify Installation:**
   ```powershell
   docker --version
   docker compose --version
   ```

### 2. Alternative: Install Docker via Chocolatey (if you have it)

```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Docker Desktop
choco install docker-desktop
```

## Project Setup

### Step 1: Navigate to Project Directory

```powershell
cd C:\FH\BA_2
```

### Step 2: Verify Project Structure

Make sure you have the following structure:
```
BA_2/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── runner/
│   ├── Dockerfile
│   └── app/
├── frontend/
├── tasks/
├── docker-compose.yml
└── README.md
```

### Step 3: Start Docker Desktop

1. Launch Docker Desktop from Start Menu
2. Wait for Docker to fully start (green status in system tray)
3. Verify Docker is running:
   ```powershell
   docker ps
   ```

### Step 4: Build and Run the Project

```powershell
# Build and start all services
docker compose up --build
```

This command will:
- Build Docker images for backend and runner
- Create necessary directories
- Start all three services (backend, runner, frontend)
- Set up networking between containers

### Step 5: Verify Services are Running

Open a new PowerShell window and check the containers:

```powershell
docker compose ps
```

You should see output similar to:
```
NAME             IMAGE                    COMMAND                  SERVICE   CREATED          STATUS                    PORTS
aca-backend      ba_2-backend            "node src/index.js"      backend   2 minutes ago    Up 2 minutes (healthy)   0.0.0.0:3000->3000/tcp
aca-frontend     nginx:alpine             "/docker-entrypoint.…"   frontend  2 minutes ago    Up 2 minutes             0.0.0.0:5173->80/tcp
aca-runner       ba_2-runner             "python -m flask run"    runner    2 minutes ago    Up 2 minutes (healthy)   0.0.0.0:5001->5001/tcp
```

## Access the Application

Once all services are running, you can access:

- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:5173
- **Runner Service:** http://localhost:5001

## Testing the Setup

### 1. Test Backend Health

```powershell
# Test backend endpoint
curl http://localhost:3000

# Or using PowerShell Invoke-WebRequest
Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
```

### 2. Test Runner Health

```powershell
# Test runner health endpoint
curl http://localhost:5001/health

# Or using PowerShell
Invoke-WebRequest -Uri "http://localhost:5001/health" -Method GET
```

### 3. Test Frontend

Open your web browser and navigate to: http://localhost:5173

## Complete Workflow Test

### 1. Register a User

```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    role = "student"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### 2. Login and Get Token

```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = ($response.Content | ConvertFrom-Json).token
```

### 3. Get Assignments

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-WebRequest -Uri "http://localhost:3000/assignments" -Method GET -Headers $headers
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Docker Desktop Not Starting

**Problem:** Docker Desktop fails to start
**Solutions:**
- Restart your computer
- Run Docker Desktop as Administrator
- Check if Hyper-V is enabled in Windows Features
- Ensure WSL 2 is properly installed

#### 2. Port Already in Use

**Problem:** `Error: bind: address already in use`
**Solutions:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

#### 3. Build Failures

**Problem:** Docker build fails
**Solutions:**
```powershell
# Clean up Docker system
docker system prune -a

# Rebuild without cache
docker compose build --no-cache

# Check Docker logs
docker compose logs backend
docker compose logs runner
```

#### 4. Services Not Responding

**Problem:** Services start but don't respond
**Solutions:**
```powershell
# Check container logs
docker compose logs -f

# Restart specific service
docker compose restart backend
docker compose restart runner

# Check container status
docker compose ps
```

#### 5. Database Issues

**Problem:** Database-related errors
**Solutions:**
```powershell
# Stop all services
docker compose down

# Remove data directory (WARNING: This will delete all data)
Remove-Item -Recurse -Force .\data

# Restart services
docker compose up --build
```

### Useful Commands

```powershell
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f runner

# Stop all services
docker compose down

# Stop and remove all containers, networks, and volumes
docker compose down -v

# Rebuild and restart
docker compose up --build

# Execute commands in running container
docker compose exec backend sh
docker compose exec runner bash

# Check resource usage
docker stats
```

## Development Mode

For development, you might want to run services individually:

### Backend Development
```powershell
cd backend
npm install
npm start
```

### Runner Development
```powershell
cd runner
pip install flask
python -m flask run --host=0.0.0.0 --port=5001
```

## Production Deployment

For production deployment:

1. **Update Environment Variables:**
   - Change `JWT_SECRET` to a secure random string
   - Set `NODE_ENV=production`
   - Configure proper database paths

2. **Security Considerations:**
   - Use HTTPS in production
   - Implement proper authentication
   - Set up monitoring and logging
   - Configure firewall rules

3. **Docker Compose for Production:**
   ```yaml
   # Add to docker-compose.yml
   environment:
     - NODE_ENV=production
     - JWT_SECRET=your-secure-secret-key
   ```

## Next Steps

Once the setup is complete:

1. **Explore the API:** Use the endpoints documented in PROJECT_EXPLANATION.md
2. **Create Test Submissions:** Try submitting solutions for the available tasks
3. **Customize Tasks:** Add new programming tasks in the `tasks/` directory
4. **Extend Functionality:** Add new features like additional programming languages

## Support

If you encounter issues:

1. Check the logs: `docker compose logs -f`
2. Verify Docker is running: `docker ps`
3. Check port availability: `netstat -ano | findstr :3000`
4. Restart Docker Desktop if needed
5. Review this troubleshooting section

---

**Happy Coding! 🚀**





