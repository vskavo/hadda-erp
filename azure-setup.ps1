# Script de PowerShell para configurar Azure Deployment
# Ejecutar en PowerShell como Administrador

Write-Host "=== Configuración de Azure Deployment para Hadda ERP ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si Azure CLI está instalado
Write-Host "Verificando Azure CLI..." -ForegroundColor Yellow
$azCommand = Get-Command az -ErrorAction SilentlyContinue

if (-not $azCommand) {
    Write-Host "Azure CLI no está instalado." -ForegroundColor Red
    Write-Host "¿Deseas instalarlo ahora? (S/N): " -ForegroundColor Yellow -NoNewline
    $install = Read-Host
    
    if ($install -eq "S" -or $install -eq "s") {
        Write-Host "Instalando Azure CLI..." -ForegroundColor Green
        winget install Microsoft.AzureCLI
        Write-Host "Por favor, reinicia PowerShell y ejecuta este script nuevamente." -ForegroundColor Yellow
        exit
    } else {
        Write-Host "No se puede continuar sin Azure CLI." -ForegroundColor Red
        exit
    }
}

Write-Host "✓ Azure CLI encontrado" -ForegroundColor Green
Write-Host ""

# Login a Azure
Write-Host "Iniciando sesión en Azure..." -ForegroundColor Yellow
az login

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al iniciar sesión en Azure." -ForegroundColor Red
    exit
}

Write-Host "✓ Sesión iniciada correctamente" -ForegroundColor Green
Write-Host ""

# Obtener Subscription ID
Write-Host "Obteniendo Subscription ID..." -ForegroundColor Yellow
$subscriptionId = az account show --query id --output tsv

if (-not $subscriptionId) {
    Write-Host "Error al obtener Subscription ID." -ForegroundColor Red
    exit
}

Write-Host "✓ Subscription ID: $subscriptionId" -ForegroundColor Green
Write-Host ""

# Listar App Services disponibles
Write-Host "Listando tus App Services..." -ForegroundColor Yellow
az webapp list --output table
Write-Host ""

# Solicitar información del usuario
Write-Host "=== Información Requerida ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ingresa el nombre de tu Resource Group: " -ForegroundColor Yellow -NoNewline
$resourceGroup = Read-Host

Write-Host "Ingresa el nombre de tu App Service: " -ForegroundColor Yellow -NoNewline
$appName = Read-Host

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "Subscription ID: $subscriptionId" -ForegroundColor White
Write-Host "Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "App Service: $appName" -ForegroundColor White
Write-Host ""

Write-Host "¿Es correcta esta información? (S/N): " -ForegroundColor Yellow -NoNewline
$confirm = Read-Host

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operación cancelada." -ForegroundColor Red
    exit
}

# Crear Service Principal
Write-Host ""
Write-Host "Creando Service Principal..." -ForegroundColor Yellow
$scope = "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.Web/sites/$appName"
$spName = "github-deploy-$appName"

Write-Host "Nombre del Service Principal: $spName" -ForegroundColor White
Write-Host "Scope: $scope" -ForegroundColor White
Write-Host ""

$credentials = az ad sp create-for-rbac --name $spName --role contributor --scopes $scope --sdk-auth 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error al crear Service Principal." -ForegroundColor Red
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  1. El Service Principal ya existe (usa otro nombre)" -ForegroundColor White
    Write-Host "  2. No tienes permisos suficientes en Azure" -ForegroundColor White
    Write-Host "  3. El Resource Group o App Service no existe" -ForegroundColor White
    Write-Host ""
    Write-Host "Verifica la información e intenta nuevamente." -ForegroundColor Yellow
    exit
}

Write-Host "✓ Service Principal creado exitosamente" -ForegroundColor Green
Write-Host ""

# Guardar credentials en archivo
$outputFile = "azure-credentials.json"
$credentials | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "=== IMPORTANTE: GitHub Secrets ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Las credenciales han sido guardadas en: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora debes configurar los siguientes secrets en GitHub:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a: GitHub → Tu Repositorio → Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host ""
Write-Host "2. Crea el secret: AZURE_CREDENTIALS" -ForegroundColor White
Write-Host "   - Abre el archivo: $outputFile" -ForegroundColor Gray
Write-Host "   - Copia TODO el contenido JSON" -ForegroundColor Gray
Write-Host "   - Pégalo como valor del secret" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Crea el secret: AZURE_WEBAPP_NAME" -ForegroundColor White
Write-Host "   - Valor: $appName" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  NUNCA compartas o subas este archivo a Git" -ForegroundColor Red
Write-Host ""

# Abrir archivo automáticamente
Write-Host "¿Deseas abrir el archivo de credenciales ahora? (S/N): " -ForegroundColor Yellow -NoNewline
$openFile = Read-Host

if ($openFile -eq "S" -or $openFile -eq "s") {
    notepad $outputFile
}

Write-Host ""
Write-Host "=== Configuración Completada ===" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. ✓ Service Principal creado" -ForegroundColor Green
Write-Host "2. ⏳ Configurar secrets en GitHub (ver arriba)" -ForegroundColor Yellow
Write-Host "3. ⏳ Hacer commit y push de los cambios" -ForegroundColor Yellow
Write-Host "4. ⏳ El deployment se ejecutará automáticamente" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para más información, revisa: AZURE_SERVICE_PRINCIPAL_SETUP.md" -ForegroundColor White
Write-Host ""

