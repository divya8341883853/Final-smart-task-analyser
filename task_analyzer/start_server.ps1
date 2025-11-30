# Script to find Python and start Django server

Write-Host "Searching for Python..." -ForegroundColor Yellow

# Common Python locations
$pythonPaths = @(
    "$env:LOCALAPPDATA\Microsoft\WindowsApps\python.exe",
    "$env:LOCALAPPDATA\Microsoft\WindowsApps\python3.exe",
    "$env:LOCALAPPDATA\Microsoft\WindowsApps\python3.12.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "C:\Python312\python.exe",
    "C:\Python311\python.exe",
    "C:\Program Files\Python312\python.exe",
    "C:\Program Files\Python311\python.exe"
)

$pythonExe = $null

foreach ($path in $pythonPaths) {
    if (Test-Path $path) {
        $pythonExe = $path
        Write-Host "Found Python at: $path" -ForegroundColor Green
        break
    }
}

if (-not $pythonExe) {
    Write-Host "Python not found in common locations." -ForegroundColor Red
    Write-Host "Please provide the full path to python.exe" -ForegroundColor Yellow
    Write-Host "For example: C:\Users\YourName\AppData\Local\Programs\Python\Python312\python.exe" -ForegroundColor Yellow
    $pythonExe = Read-Host "Enter Python path (or press Enter to exit)"
    
    if (-not $pythonExe -or -not (Test-Path $pythonExe)) {
        Write-Host "Python not found. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nUsing Python: $pythonExe" -ForegroundColor Green
Write-Host "Python version:" -ForegroundColor Cyan
& $pythonExe --version

Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
& $pythonExe -m pip install -r requirements.txt

Write-Host "`nRunning migrations..." -ForegroundColor Yellow
& $pythonExe manage.py migrate

Write-Host "`nStarting Django server..." -ForegroundColor Green
Write-Host "Server will be available at: http://127.0.0.1:8000" -ForegroundColor Cyan
& $pythonExe manage.py runserver

