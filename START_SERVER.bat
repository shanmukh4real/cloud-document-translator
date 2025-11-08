@echo off
echo ========================================
echo Starting Translation App Server
echo ========================================
echo.
echo Checking for Python...
python --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo.
echo Starting server on http://localhost:8000
echo.
echo Your browser will open automatically in 3 seconds...
echo Press Ctrl+C to stop the server
echo.

timeout /t 3 /nobreak >nul
start http://localhost:8000/index.html

python server.py

pause
