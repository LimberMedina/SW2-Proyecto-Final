# Script de instalación para RF14 - Procesamiento Audiovisual con IA
# Ejecutar desde el directorio backend

Write-Host "🎬 Instalando dependencias para procesamiento audiovisual..." -ForegroundColor Cyan
Write-Host ""

# Instalar dependencias de Python
Write-Host "📦 Instalando paquetes de Python..." -ForegroundColor Yellow
pip install moviepy Pillow --upgrade

Write-Host ""
Write-Host "✅ Instalación completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Dependencias instaladas:" -ForegroundColor Cyan
Write-Host "  - moviepy: Procesamiento de video y audio" -ForegroundColor White
Write-Host "  - Pillow: Generación de thumbnails" -ForegroundColor White
Write-Host "  - groq: API de IA (ya instalado)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Funcionalidades disponibles:" -ForegroundColor Cyan
Write-Host "  ✓ Generación automática de subtítulos" -ForegroundColor Green
Write-Host "  ✓ Análisis de contenido con IA" -ForegroundColor Green
Write-Host "  ✓ Generación de thumbnails inteligentes" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Ver documentación completa en:" -ForegroundColor Yellow
Write-Host "  backend/catalogodigital/VIDEO_PROCESSING_README.md" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Recuerda tener GROQ_API_KEY configurado en .env" -ForegroundColor Magenta
Write-Host ""
