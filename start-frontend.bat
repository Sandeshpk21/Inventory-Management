@echo off
echo Starting Inventory Management System Frontend...
echo.

cd frontend

echo Installing dependencies...
npm install

echo Starting Vite development server...
echo Frontend will be available at: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause 