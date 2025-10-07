# Setup script for the ACA Frontend
Write-Host "=== ACA Frontend Setup ===" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

# Build the frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to build frontend" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Frontend built successfully" -ForegroundColor Green

# Go back to root directory
Set-Location ..

Write-Host "" -ForegroundColor White
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "Frontend has been built and is ready to be served by the backend." -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend: cd backend && npm start" -ForegroundColor White
Write-Host "2. Start the runner: cd runner && python run.py" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
