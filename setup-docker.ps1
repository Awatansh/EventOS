$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting EventOS setup..." -ForegroundColor Cyan

# 1. Start Database
Write-Host "📦 Starting PostgreSQL container..." -ForegroundColor Yellow
docker compose up db -d

Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 2. Install dependencies
Write-Host "📦 Installing all dependencies..." -ForegroundColor Yellow
npm run install:all


# 4. Run migrations and seed
Write-Host "🛠️ Running database migrations..." -ForegroundColor Yellow
npm run migrate --prefix backend

Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Yellow
npm run seed --prefix backend

# 5. Start dev server
Write-Host "🌟 Setup complete! Starting development servers..." -ForegroundColor Green
Write-Host "👉 The frontend will be available at http://localhost:5173" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------"
npm run dev
