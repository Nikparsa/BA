# Verify Docker Installation and Run Project
# Run this after Docker Desktop is installed and running

Write-Host "=== Docker Setup Verification ===" -ForegroundColor Cyan

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Run the quick-install-docker.ps1 script as Administrator." -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version
    Write-Host "✓ Docker Compose available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose not found." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        Write-Host "Look for the Docker whale icon in your system tray." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if we're in the right directory
Write-Host "Checking project directory..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "✓ Found docker-compose.yml in current directory" -ForegroundColor Green
} else {
    Write-Host "✗ docker-compose.yml not found. Please run this script from the BA_2 directory." -ForegroundColor Red
    exit 1
}

# Start the project
Write-Host "" -ForegroundColor White
Write-Host "=== Starting Automated Code Assessment System ===" -ForegroundColor Cyan
Write-Host "This will build and start all services..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

try {
    docker compose up --build
} catch {
    Write-Host "✗ Failed to start services: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}





