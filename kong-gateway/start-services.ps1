# Script para iniciar os serviços do Kong Gateway após correção do Docker
Write-Host "`n=== Iniciando Serviços do Kong Gateway ===" -ForegroundColor Cyan

Write-Host "`n[1/4] Parando containers existentes..." -ForegroundColor Yellow
docker compose down 2>$null

Write-Host "`n[2/4] Limpando configuração gerada anterior..." -ForegroundColor Yellow
Remove-Item -Path "kong.generated.yml" -ErrorAction SilentlyContinue

Write-Host "`n[3/4] Reconstruindo e iniciando todos os serviços..." -ForegroundColor Yellow
docker compose up -d --build

Write-Host "`n[4/4] Verificando status dos containers..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker compose ps

Write-Host "`n=== Serviços Disponíveis ===" -ForegroundColor Green
Write-Host "Kong Proxy:        http://localhost:8000" -ForegroundColor White
Write-Host "Kong Admin:        http://localhost:8001" -ForegroundColor White
Write-Host "Kong GUI:          http://localhost:8002" -ForegroundColor White
Write-Host "MS Orders:         http://localhost:3001" -ForegroundColor White
Write-Host "MS Customers:      http://localhost:3002" -ForegroundColor White
Write-Host "MS Notifications:  http://localhost:3003" -ForegroundColor White
Write-Host "MS Routing:        http://localhost:3004" -ForegroundColor White
Write-Host "MS Delivery:       http://localhost:3005 (NOVO!)" -ForegroundColor Cyan
Write-Host "`nPara ver logs: docker compose logs -f msdelivery" -ForegroundColor Gray
