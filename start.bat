@echo off
rem Starts the Human Anatomy 3D website and opens it in your browser.
cd /d "%~dp0web"
if not exist node_modules (
  echo Installing dependencies (first run only)...
  call npm install
)
call npm run dev -- --open
