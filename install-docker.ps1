# Docker Desktop Installation Script
# Run this script as Administrator in PowerShell

Write-Host "Installing Docker Desktop..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script needs to be run as Administrator. Please restart PowerShell as Administrator and try again." -ForegroundColor Red
    exit 1
}

# Install Chocolatey if not already installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install Docker Desktop
Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
choco install docker-desktop -y

Write-Host "Docker Desktop installation completed!" -ForegroundColor Green
Write-Host "Please restart your computer and then start Docker Desktop from the Start Menu." -ForegroundColor Yellow
Write-Host "After Docker Desktop is running, you can run: docker compose up --build" -ForegroundColor Cyan





