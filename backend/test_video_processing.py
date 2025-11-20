"""
Script de prueba para diagnóstico de video processing
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("=" * 60)
print("TEST: Video Processing Service")
print("=" * 60)

# Test 1: Import check
print("\n1. Verificando imports...")
try:
    from catalogodigital.video_processing import VideoProcessingService
    print("✓ VideoProcessingService imported")
except Exception as e:
    print(f"✗ Error importing VideoProcessingService: {e}")
    sys.exit(1)

# Test 2: Service initialization
print("\n2. Inicializando servicio...")
try:
    service = VideoProcessingService()
    print(f"✓ Service initialized")
    print(f"  API Key configured: {service.is_available()}")
except Exception as e:
    print(f"✗ Error initializing service: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Check moviepy
print("\n3. Verificando moviepy...")
try:
    from moviepy.editor import VideoFileClip
    print("✓ moviepy imported successfully")
except Exception as e:
    print(f"✗ Error importing moviepy: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Check groq
print("\n4. Verificando groq...")
try:
    from groq import Groq
    print("✓ groq imported successfully")
except Exception as e:
    print(f"✗ Error importing groq: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Find video file
print("\n5. Buscando archivo de video...")
from catalogodigital.models import Video
try:
    video = Video.objects.get(pk=7)
    print(f"✓ Video encontrado: {video.titulo}")
    print(f"  Archivo: {video.archivo_video}")
    print(f"  Path exists: {os.path.exists(video.archivo_video.path) if video.archivo_video else False}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 6: Try extract audio
print("\n6. Intentando extraer audio...")
try:
    video = Video.objects.get(pk=7)
    if video.archivo_video:
        result = service.extract_audio(video.archivo_video.path)
        print(f"  Result: {result}")
        if result['success']:
            print("✓ Audio extraído exitosamente")
            # Clean up
            if os.path.exists(result['audio_path']):
                os.remove(result['audio_path'])
        else:
            print(f"✗ Error: {result.get('error')}")
    else:
        print("✗ Video no tiene archivo")
except Exception as e:
    print(f"✗ Excepción: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Test completado")
print("=" * 60)
