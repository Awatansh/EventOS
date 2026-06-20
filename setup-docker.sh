#!/bin/bash
set -e

echo "🚀 Starting EventOS setup..."

# 1. Start Database
echo "📦 Starting PostgreSQL container..."
docker compose up db -d

echo "⏳ Waiting for PostgreSQL to be ready..."
# Simple wait to ensure DB is ready to accept connections
sleep 5

# 2. Install dependencies
echo "📦 Installing all dependencies..."
npm run install:all


# 4. Run migrations and seed
echo "🛠️ Running database migrations..."
npm run migrate --prefix backend

echo "🌱 Seeding database with sample data..."
npm run seed --prefix backend

# 5. Start dev server
echo "🌟 Setup complete! Starting development servers..."
echo "👉 The frontend will be available at http://localhost:5173"
echo "--------------------------------------------------------"
npm run dev
