# IzaManagement - Windows Preview Bootstrap (PowerShell)
# Runs the full preview stack: app, nginx, postgres, redis, queue, scheduler
# Usage:
#   - In PowerShell (Run as admin or user):
#       Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#       .\scripts\preview.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Choose compose command (new vs legacy)
$composeBase = "docker compose"
try { & docker compose version | Out-Null } catch { $composeBase = "docker-compose" }
$compose = "$composeBase -f docker-compose.preview.yml"

Write-Host "[preview] Building and starting containers..." -ForegroundColor Cyan
& $composeBase -v | Out-Null
& $compose up -d --build

Write-Host "[preview] Waiting for Postgres readiness..." -ForegroundColor Cyan
$postgresReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        & $compose exec -T postgres pg_isready -U izauser -d izamanagement | Out-Null
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
        & $compose exec -T app php artisan $args
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
& $compose ps