#!/bin/bash
set -e

echo "🚀 Starting EventOS Neon Setup..."

echo "📦 Installing all dependencies..."
npm run install:all

echo "🛠️ Running database migrations to Neon..."
npm run migrate --prefix backend

echo "🌱 Seeding database with sample data..."
npm run seed --prefix backend

echo "🌟 Setup complete! Starting development servers..."
echo "👉 The frontend will be available at http://localhost:5173"
echo "--------------------------------------------------------"
npm run dev
