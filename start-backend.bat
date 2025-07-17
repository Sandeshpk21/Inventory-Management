@echo off
echo Starting Inventory Management System Backend...
echo.

cd backend

echo Creating virtual environment if it doesn't exist...
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created.
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Starting FastAPI server...
echo API will be available at: http://localhost:8000
echo API docs will be available at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause 