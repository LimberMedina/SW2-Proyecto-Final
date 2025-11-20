"""
Módulo de búsqueda semántica con IA usando Groq.
Proporciona funcionalidades para búsqueda inteligente de videos usando procesamiento de lenguaje natural.
"""

from django.conf import settings
from django.db.models import Q
import json


class SemanticSearchService:
    """
    Servicio de búsqueda semántica usando Groq API.
    Analiza consultas en lenguaje natural y encuentra videos relevantes.
    """
    
    def __init__(self, api_key=None):
        """
        Inicializa el servicio de búsqueda semántica.
        
        Args:
            api_key (str, optional): API key de Groq. Si no se proporciona, usa settings.GROQ_API_KEY
        """
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = "llama-3.3-70b-versatile"
        self.temperature = 0.3
        self.max_tokens = 1000
        self.max_videos_context = 100  # Limitar contexto para no exceder tokens
        self.max_results = 20
    
    def is_available(self):
        """
        Verifica si el servicio de búsqueda semántica está disponible.
        
        Returns:
            bool: True si la API key está configurada, False en caso contrario
        """
        return bool(self.api_key)
    
    def search(self, query, videos_queryset):
        """
        Realiza una búsqueda semántica sobre el queryset de videos.
        
        Args:
            query (str): Consulta de búsqueda en lenguaje natural
            videos_queryset: QuerySet de Django con los videos disponibles
        
        Returns:
            dict: Diccionario con resultados y metadatos:
                - success (bool): Si la búsqueda fue exitosa
                - video_ids (list): IDs de videos ordenados por relevancia
                - reasoning (str): Explicación de la relevancia
                - error (str, optional): Mensaje de error si falló
                - error_type (str, optional): Tipo de error
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
            # Obtener videos con contexto
            videos = list(videos_queryset.values(
                'id', 'titulo', 'descripcion', 
                'capitulo__nombre', 
                'capitulo__categoria__nombre',
                'capitulo__categoria__catalogo__nombre'
            )[:self.max_videos_context])
            
            if not videos:
                return {
                    'success': True,
                    'video_ids': [],
                    'reasoning': 'No hay videos disponibles'
                }
            
            # Inicializar cliente Groq
            client = Groq(api_key=self.api_key)
            
            # Crear contexto para el modelo
            videos_context = self._build_videos_context(videos)
            
            # Generar prompt
            prompt = self._build_search_prompt(query, videos_context)
            
            # Llamar a Groq API
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un experto en búsqueda semántica. Respondes SOLO con JSON válido, sin markdown ni texto adicional."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}
            )
            
            # Parsear respuesta
            response_text = chat_completion.choices[0].message.content
            result = json.loads(response_text)
            
            video_ids = result.get('video_ids', [])
            reasoning = result.get('reasoning', 'Búsqueda completada')
            
            return {
                'success': True,
                'video_ids': video_ids,
                'reasoning': reasoning
            }
            
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error': f'Error al parsear respuesta del modelo: {str(e)}',
                'error_type': 'json_error'
            }
        except Exception as e:
            return self._handle_groq_error(e)
    
    def _build_videos_context(self, videos):
        """
        Construye el contexto de videos para el prompt.
        
        Args:
            videos (list): Lista de diccionarios con información de videos
        
        Returns:
            str: Contexto formateado para el modelo
        """
        return "\n".join([
            f"ID:{v['id']} | Título: {v['titulo']} | Descripción: {v.get('descripcion', 'N/A')} | "
            f"Capítulo: {v.get('capitulo__nombre', 'N/A')} | "
            f"Categoría: {v.get('capitulo__categoria__nombre', 'N/A')} | "
            f"Catálogo: {v.get('capitulo__categoria__catalogo__nombre', 'N/A')}"
            for v in videos
        ])
    
    def _build_search_prompt(self, query, videos_context):
        """
        Construye el prompt para el modelo de IA.
        
        Args:
            query (str): Consulta del usuario
            videos_context (str): Contexto de videos disponibles
        
        Returns:
            str: Prompt completo para el modelo
        """
        return f"""Eres un asistente de búsqueda semántica para una videoteca universitaria.

Consulta del usuario: "{query}"

Base de datos de videos disponibles:
{videos_context}

Instrucciones:
1. Analiza la consulta del usuario y encuentra los videos más relevantes
2. Considera sinónimos y contexto (ej: "mates" = matemáticas, "code" = programación)
3. Devuelve SOLO un JSON válido con los IDs de los videos más relevantes
4. Ordena por relevancia (más relevante primero)
5. Incluye máximo {self.max_results} resultados

Formato de respuesta (JSON puro, sin markdown ni comentarios):
{{"video_ids": [1, 2, 3], "reasoning": "breve explicación de por qué estos videos son relevantes"}}"""
    
    def _handle_groq_error(self, error):
        """
        Maneja errores específicos de Groq API.
        
        Args:
            error (Exception): Error capturado
        
        Returns:
            dict: Diccionario con información del error
        """
        error_message = str(error).lower()
        
        if 'groq' in error_message or '500' in error_message or 'internal server error' in error_message:
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
                'error': 'Tiempo de espera agotado con el servicio de IA',
                'error_type': 'timeout'
            }
        else:
            return {
                'success': False,
                'error': f'Error en búsqueda semántica: {str(error)}',
                'error_type': 'unknown'
            }


def perform_traditional_search(queryset, query, limit=20):
    """
    Realiza una búsqueda tradicional basada en palabras clave.
    Se usa como fallback cuando la búsqueda semántica falla.
    
    Args:
        queryset: QuerySet de Django con videos
        query (str): Consulta de búsqueda
        limit (int): Número máximo de resultados
    
    Returns:
        QuerySet: Videos filtrados
    """
    return queryset.filter(
        Q(titulo__icontains=query) |
        Q(descripcion__icontains=query) |
        Q(capitulo__nombre__icontains=query) |
        Q(capitulo__categoria__nombre__icontains=query)
    )[:limit]
