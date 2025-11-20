"""
Módulo de procesamiento audiovisual asistido por IA.
Proporciona funcionalidades de:
- Generación de subtítulos automáticos
- Extracción de audio
- Análisis de contenido
- Generación de thumbnails inteligentes
"""

from django.conf import settings
import os
import tempfile
import json


class VideoProcessingService:
    """
    Servicio de procesamiento de video usando herramientas de IA.
    """
    
    def __init__(self, api_key=None):
        """
        Inicializa el servicio de procesamiento de video.
        
        Args:
            api_key (str, optional): API key de Groq. Si no se proporciona, usa settings.GROQ_API_KEY
        """
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = "whisper-large-v3"  # Modelo de Groq para transcripción
        self.llm_model = "llama-3.3-70b-versatile"  # Para análisis de contenido
    
    def is_available(self):
        """
        Verifica si el servicio está disponible.
        
        Returns:
            bool: True si la API key está configurada, False en caso contrario
        """
        return bool(self.api_key)
    
    def extract_audio(self, video_path):
        """
        Extrae el audio de un video usando moviepy.
        
        Args:
            video_path (str): Ruta al archivo de video
        
        Returns:
            dict: Resultado con ruta del audio extraído o error
        """
        try:
            from moviepy import VideoFileClip
        except ImportError:
            return {
                'success': False,
                'error': 'moviepy no está instalado. Instale con: pip install moviepy',
                'error_type': 'import_error'
            }
        
        try:
            # Crear archivo temporal para el audio
            temp_audio = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
            temp_audio_path = temp_audio.name
            temp_audio.close()
            
            # Extraer audio
            video = VideoFileClip(video_path)
            video.audio.write_audiofile(temp_audio_path, logger=None)
            video.close()
            
            return {
                'success': True,
                'audio_path': temp_audio_path
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error al extraer audio: {str(e)}',
                'error_type': 'extraction_error'
            }
    
    def transcribe_audio(self, audio_path, language='es'):
        """
        Transcribe audio usando Groq Whisper.
        
        Args:
            audio_path (str): Ruta al archivo de audio
            language (str): Código de idioma (es, en, etc.)
        
        Returns:
            dict: Transcripción con timestamps o error
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'API key de Groq no configurada',
                'error_type': 'config_error'
            }
        
        try:
            from groq import Groq
        except ImportError:
            return {
                'success': False,
                'error': 'El paquete groq no está instalado',
                'error_type': 'import_error'
            }
        
        try:
            client = Groq(api_key=self.api_key)
            
            # Leer archivo de audio
            with open(audio_path, 'rb') as audio_file:
                # Transcribir con Whisper
                transcription = client.audio.transcriptions.create(
                    file=audio_file,
                    model=self.model,
                    language=language,
                    response_format="verbose_json",  # Incluye timestamps
                    temperature=0.0
                )
            
            return {
                'success': True,
                'text': transcription.text,
                'segments': getattr(transcription, 'segments', []),
                'language': language
            }
            
        except Exception as e:
            return self._handle_groq_error(e)
    
    def generate_subtitles(self, video_path, language='es', format='srt'):
        """
        Genera subtítulos para un video.
        
        Args:
            video_path (str): Ruta al archivo de video
            language (str): Código de idioma
            format (str): Formato de subtítulos (srt, vtt, txt)
        
        Returns:
            dict: Subtítulos generados o error
        """
        # Paso 1: Extraer audio
        audio_result = self.extract_audio(video_path)
        if not audio_result['success']:
            return audio_result
        
        audio_path = audio_result['audio_path']
        
        try:
            # Paso 2: Transcribir audio
            transcription_result = self.transcribe_audio(audio_path, language)
            
            if not transcription_result['success']:
                return transcription_result
            
            # Paso 3: Generar subtítulos en el formato solicitado
            if format == 'srt':
                subtitles = self._format_srt(transcription_result.get('segments', []))
            elif format == 'vtt':
                subtitles = self._format_vtt(transcription_result.get('segments', []))
            else:  # txt
                subtitles = transcription_result['text']
            
            return {
                'success': True,
                'subtitles': subtitles,
                'format': format,
                'text': transcription_result['text'],
                'language': language
            }
            
        finally:
            # Limpiar archivo temporal de audio
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except:
                pass
    
    def analyze_content(self, transcription_text, video_metadata):
        """
        Analiza el contenido del video usando IA para generar resumen y tags.
        
        Args:
            transcription_text (str): Texto transcrito del video
            video_metadata (dict): Metadatos del video (título, descripción, etc.)
        
        Returns:
            dict: Análisis con resumen, tags, categorías sugeridas
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'API key de Groq no configurada',
                'error_type': 'config_error'
            }
        
        try:
            from groq import Groq
        except ImportError:
            return {
                'success': False,
                'error': 'El paquete groq no está instalado',
                'error_type': 'import_error'
            }
        
        try:
            client = Groq(api_key=self.api_key)
            
            # Construir prompt para análisis
            prompt = f"""Analiza el siguiente contenido de video educativo y proporciona:
1. Un resumen breve (2-3 oraciones)
2. 5-8 palabras clave relevantes
3. Temas principales cubiertos
4. Nivel educativo sugerido (principiante, intermedio, avanzado)

Título: {video_metadata.get('titulo', 'N/A')}
Descripción: {video_metadata.get('descripcion', 'N/A')}

Transcripción:
{transcription_text[:3000]}  # Limitar a 3000 caracteres para no exceder tokens

Responde SOLO con JSON válido en este formato:
{{
  "resumen": "texto del resumen",
  "palabras_clave": ["palabra1", "palabra2", ...],
  "temas": ["tema1", "tema2", ...],
  "nivel": "principiante|intermedio|avanzado",
  "duracion_sugerida": "estimación en minutos"
}}"""

            # Llamar a Groq
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un experto en análisis de contenido educativo. Respondes SOLO con JSON válido."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.llm_model,
                temperature=0.3,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            # Parsear respuesta
            response_text = chat_completion.choices[0].message.content
            analysis = json.loads(response_text)
            
            return {
                'success': True,
                'analysis': analysis
            }
            
        except Exception as e:
            return self._handle_groq_error(e)
    
    def _format_srt(self, segments):
        """
        Formatea segmentos de transcripción a formato SRT.
        
        Args:
            segments (list): Lista de segmentos con timestamps
        
        Returns:
            str: Subtítulos en formato SRT
        """
        if not segments:
            return ""
        
        srt_lines = []
        for i, segment in enumerate(segments, start=1):
            start = self._format_timestamp_srt(segment.get('start', 0))
            end = self._format_timestamp_srt(segment.get('end', 0))
            text = segment.get('text', '').strip()
            
            if text:
                srt_lines.append(f"{i}")
                srt_lines.append(f"{start} --> {end}")
                srt_lines.append(text)
                srt_lines.append("")  # Línea en blanco
        
        return "\n".join(srt_lines)
    
    def _format_vtt(self, segments):
        """
        Formatea segmentos de transcripción a formato WebVTT.
        
        Args:
            segments (list): Lista de segmentos con timestamps
        
        Returns:
            str: Subtítulos en formato VTT
        """
        if not segments:
            return "WEBVTT\n\n"
        
        vtt_lines = ["WEBVTT", ""]
        for segment in segments:
            start = self._format_timestamp_vtt(segment.get('start', 0))
            end = self._format_timestamp_vtt(segment.get('end', 0))
            text = segment.get('text', '').strip()
            
            if text:
                vtt_lines.append(f"{start} --> {end}")
                vtt_lines.append(text)
                vtt_lines.append("")  # Línea en blanco
        
        return "\n".join(vtt_lines)
    
    def _format_timestamp_srt(self, seconds):
        """
        Formatea segundos a timestamp SRT (HH:MM:SS,mmm).
        
        Args:
            seconds (float): Tiempo en segundos
        
        Returns:
            str: Timestamp formateado
        """
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
    
    def _format_timestamp_vtt(self, seconds):
        """
        Formatea segundos a timestamp VTT (HH:MM:SS.mmm).
        
        Args:
            seconds (float): Tiempo en segundos
        
        Returns:
            str: Timestamp formateado
        """
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"
    
    def _handle_groq_error(self, error):
        """
        Maneja errores específicos de Groq API.
        
        Args:
            error (Exception): Error capturado
        
        Returns:
            dict: Diccionario con información del error
        """
        error_message = str(error).lower()
        
        if 'groq' in error_message or '500' in error_message:
            return {
                'success': False,
                'error': 'El servicio de IA de Groq está temporalmente no disponible',
                'error_type': 'groq_service_unavailable'
            }
        elif 'rate' in error_message or '429' in error_message:
            return {
                'success': False,
                'error': 'Límite de uso del API excedido',
                'error_type': 'rate_limit'
            }
        elif 'timeout' in error_message:
            return {
                'success': False,
                'error': 'Tiempo de espera agotado',
                'error_type': 'timeout'
            }
        elif 'file' in error_message and 'size' in error_message:
            return {
                'success': False,
                'error': 'El archivo de audio es demasiado grande. Máximo 25MB',
                'error_type': 'file_too_large'
            }
        else:
            return {
                'success': False,
                'error': f'Error en procesamiento: {str(error)}',
                'error_type': 'unknown'
            }


def generate_smart_thumbnail(video_path, output_path, timestamp=None):
    """
    Genera un thumbnail inteligente del video.
    Si no se especifica timestamp, extrae el frame más representativo.
    
    Args:
        video_path (str): Ruta al archivo de video
        output_path (str): Ruta donde guardar el thumbnail
        timestamp (float, optional): Segundo específico para capturar
    
    Returns:
        dict: Resultado de la generación
    """
    try:
        from moviepy import VideoFileClip
        import numpy as np
    except ImportError:
        return {
            'success': False,
            'error': 'moviepy no está instalado',
            'error_type': 'import_error'
        }
    
    try:
        video = VideoFileClip(video_path)
        
        if timestamp is None:
            # Extraer frame del medio del video
            timestamp = video.duration / 2
        
        # Asegurar que el timestamp está dentro del rango
        timestamp = max(0, min(timestamp, video.duration))
        
        # Extraer frame
        frame = video.get_frame(timestamp)
        
        # Guardar como imagen
        from PIL import Image
        img = Image.fromarray(frame)
        img.thumbnail((1280, 720))  # Redimensionar manteniendo aspecto
        img.save(output_path, quality=85, optimize=True)
        
        video.close()
        
        return {
            'success': True,
            'thumbnail_path': output_path,
            'timestamp': timestamp
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Error al generar thumbnail: {str(e)}',
            'error_type': 'generation_error'
        }
