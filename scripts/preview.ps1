# IzaManagement - Windows Preview Bootstrap (PowerShell)
# Runs the full preview stack: app, nginx, postgres, redis, queue, scheduler
# Usage:
#   - In PowerShell (Run as admin or user):
#       Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#       .\scripts\preview.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Robust detection of Docker Compose CLI (v2 plugin vs legacy docker-compose)
$composeExe = "docker"
$composeSub = @("compose")
$composeFile = @("-f", "docker-compose.preview.yml")

$composeV2Ok = $true
try { & $composeExe @composeSub "version" | Out-Null } catch { $composeV2Ok = $false }
if (-not $composeV2Ok -or $LASTEXITCODE -ne 0) {
    if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
        $composeExe = "docker-compose"
        $composeSub = @()
    } else {
        Write-Host "ERROR: Neither 'docker compose' nor 'docker-compose' is available. Install Docker Desktop (with Compose v2) or docker-compose." -ForegroundColor Red
        exit 1
    }
}

function dc {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & $composeExe @composeSub @composeFile @Args
}

Write-Host "[preview] Building and starting containers..." -ForegroundColor Cyan
dc up -d --build

Write-Host "[preview] Waiting for Postgres readiness..." -ForegroundColor Cyan
$postgresReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        dc exec -T postgres pg_isready -U izauser -d izamanagement | Out-Null
        $postgresReady = $true
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}
if ($postgresReady) {
    Write-Host "[preview] Postgres is ready." -ForegroundColor Green
} else {
    Write-Host "[preview] Postgres not ready after waiting. Proceeding anyway." -ForegroundColor Yellow
}

function Run-Artisan($args) {
    try {
        dc exec -T app php artisan $args
    } catch {
        Write-Host "[preview] artisan $args (non-fatal error, continuing)" -ForegroundColor Yellow
    }
}

Write-Host "[preview] Running Laravel setup..." -ForegroundColor Cyan
Run-Artisan "key:generate"
Run-Artisan "config:cache"
Run-Artisan "route:cache"
Run-Artisan "view:cache"
Run-Artisan "migrate --force"
Run-Artisan "db:seed --force"
Run-Artisan "storage:link"

Write-Host ""
Write-Host "Preview is up:" -ForegroundColor Green
Write-Host "  App URL:  http://localhost:8080"
Write-Host "  Health:   curl http://localhost:8080/health"
Write-Host ""
dc ps