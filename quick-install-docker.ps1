# Quick Docker Desktop Installation
# Run this as Administrator in PowerShell

Write-Host "=== Docker Desktop Quick Installer ===" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-NOT $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green

# Download Docker Desktop
$dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$installerPath = "$env:TEMP\DockerDesktopInstaller.exe"

Write-Host "Downloading Docker Desktop..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $dockerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "✓ Download completed" -ForegroundColor Green
} catch {
    Write-Host "✗ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please download manually from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Install Docker Desktop
Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
try {
    Start-Process -FilePath $installerPath -ArgumentList "install", "--quiet" -Wait
    Write-Host "✓ Installation completed" -ForegroundColor Green
} catch {
    Write-Host "✗ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue

Write-Host "" -ForegroundColor White
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host "1. RESTART your computer now" -ForegroundColor Yellow
Write-Host "2. After restart, start Docker Desktop from Start Menu" -ForegroundColor Yellow
Write-Host "3. Wait for Docker to start (green whale icon in system tray)" -ForegroundColor Yellow
Write-Host "4. Then run: docker compose up --build" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White

pause





