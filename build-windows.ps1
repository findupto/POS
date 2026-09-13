$ErrorActionPreference = 'Stop'
Write-Host 'Findupto POS - Windows Builder' -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ is required.' }
if (-not (Test-Path package-lock.json)) { npm install }
else { npm ci }
npm run build:win
Write-Host ''
Write-Host 'Build complete. Installer and portable EXE are in .\release\' -ForegroundColor Green
Get-ChildItem .\release\*.exe | Select-Object Name,Length
