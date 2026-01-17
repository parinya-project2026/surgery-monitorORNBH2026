Write-Host "🚀 Starting SurgiTrack System..." -ForegroundColor Green

# 1. Start Backend Server (Port 8000)
Write-Host "Starting Backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python run.py"

# 2. Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# 3. Start Frontend Server (Port 3000)
Write-Host "Starting Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "✅ System starting up! Check the new windows." -ForegroundColor Cyan
