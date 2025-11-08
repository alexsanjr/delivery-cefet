# Script para Iniciar Todos os Serviços

Write-Host "Iniciando microsserviços..." -ForegroundColor Green

# Inicia mscustomers
Write-Host "`nIniciando mscustomers (porta 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Dev\delivery-cefet\mscustomers; npm run start:dev"

Start-Sleep -Seconds 2

# Inicia msorders
Write-Host "Iniciando msorders (porta 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Dev\delivery-cefet\msorders; npm run start:dev"

Start-Sleep -Seconds 2

# Inicia msdelivery
Write-Host "Iniciando msdelivery (porta 3003)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Dev\delivery-cefet\msdelivery; npm run start:dev"

Write-Host "`n" -NoNewline
Write-Host "Todos os serviços foram iniciados!" -ForegroundColor Green
Write-Host "`nAguarde alguns segundos para os serviços subirem completamente..." -ForegroundColor Yellow
Write-Host "`nURLs dos Apollo Playgrounds:" -ForegroundColor Cyan
Write-Host "  - mscustomers: http://localhost:3001/graphql" -ForegroundColor White
Write-Host "  - msorders: http://localhost:3000/graphql" -ForegroundColor White
Write-Host "  - msdelivery: http://localhost:3003/graphql" -ForegroundColor White
Write-Host "`nPressione qualquer tecla para abrir os playgrounds no navegador..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3003/graphql"
Start-Process "http://localhost:3001/graphql"
Start-Process "http://localhost:3000/graphql"
