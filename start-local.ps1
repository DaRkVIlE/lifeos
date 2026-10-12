# LifeOS Local Mode — Windows Startup Script
# Inicia o Flask API (:8080) e o Vite Dev Server (:5173)

$appDir = $PSScriptRoot
$backendDir = Join-Path $appDir "backend"

Write-Host "🚀 Iniciando LifeOS Híbrido em Modo Local..." -ForegroundColor Green

# 1. Iniciar Flask Backend em background
Write-Host "📦 Iniciando API Flask (porta 8080)..." -ForegroundColor Cyan
$flaskProc = Start-Process python -ArgumentList "app.py" -WorkingDirectory $backendDir -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 2

# 2. Testar saúde do backend
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/health-check" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ API Flask operando com sucesso! (DB: $($res.database))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Aviso: API Flask iniciando ou em porta alternativa." -ForegroundColor Yellow
}

# 3. Iniciar Vite Frontend
Write-Host "🎨 Iniciando Frontend Vite (porta 5173)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host "  🎮 LifeOS Híbrido está pronto!" -ForegroundColor Green
Write-Host "  👉 Acesse: http://localhost:5173" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host ""

npm run dev -- --host 127.0.0.1 --port 5173
