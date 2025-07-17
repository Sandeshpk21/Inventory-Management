@echo off
echo ========================================
echo   Inventory Management System
echo   Quick Start Setup
echo ========================================
echo.

echo This script will help you set up the inventory management system.
echo.
echo Prerequisites:
echo - Python 3.8+ installed
echo - Node.js 16+ installed
echo - npm or yarn installed
echo.

pause

echo.
echo 🚀 Starting setup...
echo.

echo 📦 Setting up Backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo ⚡ Starting backend server in background...
start "Backend Server" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo 🌐 Setting up Frontend...
cd ..\frontend

echo Installing Node.js dependencies...
npm install

echo.
echo ⚡ Starting frontend server in background...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Waiting for frontend to start...
timeout /t 5 /nobreak > nul

echo.
echo 🎉 Setup completed!
echo.
echo 📊 Your inventory management system is now running:
echo    - Backend API: http://localhost:8000
echo    - API Documentation: http://localhost:8000/docs
echo    - Frontend: http://localhost:5173
echo.
echo 🌱 To add sample data, run:
echo    python backend/seed_data.py
echo.
echo Press any key to open the frontend in your browser...
pause

start http://localhost:5173

echo.
echo ✅ Setup complete! The system is ready to use.
echo.
pause 