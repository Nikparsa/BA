# Fix Docker Desktop Startup Issues
# Run this as Administrator

Write-Host "=== Docker Desktop Fix Script ===" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-NOT $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green

# Enable required Windows features
Write-Host "Enabling required Windows features..." -ForegroundColor Yellow

try {
    # Enable Hyper-V (if available)
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart
    
    # Enable WSL
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    
    # Enable Virtual Machine Platform
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    
    Write-Host "✓ Windows features enabled" -ForegroundColor Green
} catch {
    Write-Host "⚠ Some features may already be enabled or not available" -ForegroundColor Yellow
}

# Stop and restart Docker services
Write-Host "Restarting Docker services..." -ForegroundColor Yellow

try {
    Stop-Service "com.docker.service" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-Service "com.docker.service" -ErrorAction SilentlyContinue
    Write-Host "✓ Docker services restarted" -ForegroundColor Green
} catch {
    Write-Host "⚠ Docker service not found or already running" -ForegroundColor Yellow
}

# Clean Docker data
Write-Host "Cleaning Docker data..." -ForegroundColor Yellow
try {
    docker system prune -f
    Write-Host "✓ Docker data cleaned" -ForegroundColor Green
} catch {
    Write-Host "⚠ Docker not responding yet" -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor White
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. RESTART your computer" -ForegroundColor Yellow
Write-Host "2. After restart, start Docker Desktop from Start Menu" -ForegroundColor Yellow
Write-Host "3. Wait for Docker to fully start (solid whale icon)" -ForegroundColor Yellow
Write-Host "4. Then try: docker compose up --build" -ForegroundColor Green
Write-Host "" -ForegroundColor White

pause


