@echo off
setlocal
cd /d "%~dp0"
if not exist .env.local (
  echo Missing .env.local. Create it with GEMINI_API_KEY=your-key-here
  exit /b 1
)
docker compose up --build -d