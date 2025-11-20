"""
Vistas para el procesamiento audiovisual asistido por IA.
"""

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import os
import tempfile

from .video_processing import VideoProcessingService, generate_smart_thumbnail


class VideoProcessingMixin:
    """
    Mixin que proporciona endpoints de procesamiento de video.
    Se agrega al VideoViewSet existente.
    """
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def generar_subtitulos(self, request, pk=None):
        """
        Genera subtítulos automáticos para un video usando IA.
        
        Body params:
        - language (str): Código de idioma (es, en, etc.) - Default: es
        - format (str): Formato de subtítulos (srt, vtt, txt) - Default: srt
        
        Returns:
            Subtítulos generados en el formato especificado
        """
        video = self.get_object()
        
        # Verificar que el video tenga archivo
        if not video.archivo_video:
            return Response({
                'error': 'El video no tiene archivo asociado',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener parámetros
        language = request.data.get('language', 'es')
        subtitle_format = request.data.get('format', 'srt')
        
        # Validar formato
        if subtitle_format not in ['srt', 'vtt', 'txt']:
            return Response({
                'error': 'Formato no válido. Use: srt, vtt o txt',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Inicializar servicio
        processing_service = VideoProcessingService()
        
        if not processing_service.is_available():
            return Response({
                'error': 'Servicio de IA no disponible. Configure GROQ_API_KEY',
                'success': False
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        try:
            # Generar subtítulos
            result = processing_service.generate_subtitles(
                video.archivo_video.path,
                language=language,
                format=subtitle_format
            )
            
            if not result['success']:
                error_type = result.get('error_type', 'unknown')
                
                if error_type == 'import_error':
                    message = f"📦 Librerías de procesamiento no disponibles: {result.get('error', '')}"
                elif error_type == 'groq_service_unavailable':
                    message = 'Servicio de IA temporalmente no disponible'
                elif error_type == 'rate_limit':
                    message = 'Límite de uso del API excedido'
                elif error_type == 'file_too_large':
                    message = 'El archivo de video es demasiado grande'
                else:
                    message = result.get('error', 'Error al generar subtítulos')
                
                return Response({
                    'error': message,
                    'success': False,
                    'error_type': error_type,
                    'details': result.get('error', '')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Guardar subtítulos como archivo
            subtitle_filename = f"subtitles_{video.id}_{language}.{subtitle_format}"
            subtitle_path = f"subtitles/{subtitle_filename}"
            
            # Guardar en storage
            default_storage.save(
                subtitle_path,
                ContentFile(result['subtitles'].encode('utf-8'))
            )
            
            return Response({
                'success': True,
                'subtitles': result['subtitles'],
                'subtitle_url': default_storage.url(subtitle_path),
                'format': subtitle_format,
                'language': language,
                'text': result.get('text', ''),
                'message': 'Subtítulos generados exitosamente'
            })
            
        except Exception as e:
            return Response({
                'error': f'Error inesperado: {str(e)}',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def analizar_contenido(self, request, pk=None):
        """
        Analiza el contenido del video usando IA para generar:
        - Resumen automático
        - Palabras clave
        - Temas principales
        - Nivel educativo sugerido
        
        Body params:
        - language (str): Código de idioma para transcripción - Default: es
        
        Returns:
            Análisis completo del contenido del video
        """
        video = self.get_object()
        
        # Verificar que el video tenga archivo
        if not video.archivo_video:
            return Response({
                'error': 'El video no tiene archivo asociado',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener idioma
        language = request.data.get('language', 'es')
        
        # Inicializar servicio
        processing_service = VideoProcessingService()
        
        if not processing_service.is_available():
            return Response({
                'error': 'Servicio de IA no disponible. Configure GROQ_API_KEY',
                'success': False
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        try:
            # Paso 1: Extraer audio y transcribir
            audio_result = processing_service.extract_audio(video.archivo_video.path)
            if not audio_result['success']:
                return Response({
                    'error': audio_result.get('error', 'Error al extraer audio'),
                    'success': False,
                    'error_type': audio_result.get('error_type')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            audio_path = audio_result['audio_path']
            
            try:
                # Transcribir
                transcription_result = processing_service.transcribe_audio(audio_path, language)
                
                if not transcription_result['success']:
                    return Response({
                        'error': transcription_result.get('error', 'Error al transcribir'),
                        'success': False,
                        'error_type': transcription_result.get('error_type')
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                transcription_text = transcription_result['text']
                
                # Paso 2: Analizar contenido
                analysis_result = processing_service.analyze_content(
                    transcription_text,
                    {
                        'titulo': video.titulo,
                        'descripcion': video.descripcion
                    }
                )
                
                if not analysis_result['success']:
                    return Response({
                        'error': analysis_result.get('error', 'Error al analizar contenido'),
                        'success': False,
                        'error_type': analysis_result.get('error_type')
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                return Response({
                    'success': True,
                    'transcription': transcription_text,
                    'analysis': analysis_result['analysis'],
                    'message': 'Análisis completado exitosamente'
                })
                
            finally:
                # Limpiar archivo temporal
                try:
                    if os.path.exists(audio_path):
                        os.remove(audio_path)
                except:
                    pass
            
        except Exception as e:
            return Response({
                'error': f'Error inesperado: {str(e)}',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def generar_thumbnail(self, request, pk=None):
        """
        Genera un thumbnail inteligente para el video.
        
        Body params:
        - timestamp (float, optional): Segundo específico para capturar. 
                                      Si no se especifica, usa el medio del video
        
        Returns:
            URL del thumbnail generado
        """
        video = self.get_object()
        
        # Verificar que el video tenga archivo
        if not video.archivo_video:
            return Response({
                'error': 'El video no tiene archivo asociado',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener timestamp opcional
        timestamp = request.data.get('timestamp')
        if timestamp is not None:
            try:
                timestamp = float(timestamp)
            except (TypeError, ValueError):
                return Response({
                    'error': 'El timestamp debe ser un número',
                    'success': False
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Crear archivo temporal para el thumbnail
            temp_thumb = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
            temp_thumb_path = temp_thumb.name
            temp_thumb.close()
            
            # Generar thumbnail
            result = generate_smart_thumbnail(
                video.archivo_video.path,
                temp_thumb_path,
                timestamp=timestamp
            )
            
            if not result['success']:
                os.remove(temp_thumb_path)
                return Response({
                    'error': result.get('error', 'Error al generar thumbnail'),
                    'success': False,
                    'error_type': result.get('error_type')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Guardar en storage
            thumbnail_filename = f"thumbnail_{video.id}_{int(result['timestamp'])}.jpg"
            thumbnail_path = f"thumbnails/{thumbnail_filename}"
            
            with open(temp_thumb_path, 'rb') as f:
                default_storage.save(thumbnail_path, ContentFile(f.read()))
            
            # Limpiar archivo temporal
            os.remove(temp_thumb_path)
            
            # Actualizar video con el nuevo thumbnail
            video.miniatura = thumbnail_path
            video.save(update_fields=['miniatura'])
            
            return Response({
                'success': True,
                'thumbnail_url': default_storage.url(thumbnail_path),
                'timestamp': result['timestamp'],
                'message': 'Thumbnail generado exitosamente'
            })
            
        except Exception as e:
            return Response({
                'error': f'Error inesperado: {str(e)}',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
