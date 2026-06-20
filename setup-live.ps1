$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting EventOS Neon Setup..." -ForegroundColor Cyan

Write-Host "📦 Installing all dependencies..." -ForegroundColor Yellow
npm run install:all

Write-Host "🛠️ Running database migrations to Neon..." -ForegroundColor Yellow
npm run migrate --prefix backend

Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Yellow
npm run seed --prefix backend

Write-Host "🌟 Setup complete! Starting development servers..." -ForegroundColor Green
Write-Host "👉 The frontend will be available at http://localhost:5173" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------"
npm run dev
