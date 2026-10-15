@echo off
rem Lanceur Windows : installe et compile au premier lancement, puis démarre.
cd /d "%~dp0"
if not exist node_modules (
  echo Installation des dependances...
  call npm install || goto :err
)
if not exist client\dist\index.html (
  echo Compilation de l'interface...
  call npm run build || goto :err
)
start "" http://localhost:3210
call npm start
goto :eof
:err
echo Une erreur est survenue. Verifiez que Node.js 22.13 ou plus est installe.
pause
