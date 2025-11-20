from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model

User = get_user_model()

from .models import (
    Categoria, Catalogo, Capitulo, Video, VisualizacionVideo,
    ComentarioVideo, LikeVideo, LikeComentario, VideoGuardado, CompartirVideo
)
from .serializers import (
    CategoriaListSerializer, CategoriaDetailSerializer, CategoriaCreateSerializer,
    CatalogoListSerializer, CatalogoDetailSerializer, CatalogoCreateSerializer,
    CapituloListSerializer, CapituloDetailSerializer, CapituloCreateSerializer,
    VideoListSerializer, VideoDetailSerializer, VideoCreateSerializer,
    VideoPublicoSerializer, VisualizacionVideoSerializer,
    ComentarioVideoSerializer, ComentarioCreateSerializer,
    VideoGuardadoSerializer, CompartirVideoSerializer
)
from .video_processing_views import VideoProcessingMixin


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', '').upper() == 'ADMIN'
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Lectura a usuarios autenticados, escritura solo a administradores.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and getattr(request.user, 'rol', '').upper() == 'ADMIN'


# =======================
#  CATEGORÍAS (FK a Catálogo)
# =======================

class CategoriaViewSet(viewsets.ModelViewSet):
    """Gestionar categorías (cada categoría pertenece a un catálogo)"""
    queryset = Categoria.objects.all().select_related(
        'catalogo', 'administrador'
    ).annotate(
        total_capitulos=Count('capitulos', filter=Q(capitulos__activo=True), distinct=True),
        total_videos=Count(
            'capitulos__videos',
            filter=Q(
                capitulos__activo=True,
                capitulos__videos__activo=True,
                capitulos__videos__estado='PUBLICADO'
            ),
            distinct=True
        ),
    ).order_by('catalogo__nombre', 'codigo')

    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activo', 'administrador', 'catalogo']
    search_fields = ['codigo', 'nombre', 'descripcion', 'catalogo__nombre']
    ordering_fields = ['codigo', 'nombre', 'fecha_creacion', 'catalogo__nombre']
    ordering = ['catalogo__nombre', 'codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return CategoriaListSerializer
        elif self.action == 'retrieve':
            return CategoriaDetailSerializer
        else:
            return CategoriaCreateSerializer

    @action(detail=True, methods=['get'])
    def capitulos(self, request, pk=None):
        """Capítulos que pertenecen a esta categoría"""
        categoria = self.get_object()
        capitulos = categoria.capitulos.filter(activo=True).annotate(
            total_videos=Count('videos', filter=Q(videos__activo=True, videos__estado='PUBLICADO'), distinct=True)
        ).order_by('nombre')
        serializer = CapituloListSerializer(capitulos, many=True, context={'request': request})
        return Response(serializer.data)


# =======================
#  CATÁLOGOS (RAÍZ)
# =======================

class CatalogoViewSet(viewsets.ModelViewSet):
    """Gestionar catálogos (padre de categorías)"""
    queryset = Catalogo.objects.all().select_related('administrador').annotate(
        total_categorias=Count('categorias', filter=Q(categorias__activo=True), distinct=True),
        total_capitulos=Count(
            'categorias__capitulos',
            filter=Q(categorias__capitulos__activo=True),
            distinct=True
        ),
        total_videos=Count(
            'categorias__capitulos__videos',
            filter=Q(
                categorias__capitulos__activo=True,
                categorias__capitulos__videos__activo=True,
                categorias__capitulos__videos__estado='PUBLICADO'
            ),
            distinct=True
        ),
    ).order_by('nombre')

    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activo', 'administrador']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return CatalogoListSerializer
        elif self.action == 'retrieve':
            return CatalogoDetailSerializer
        else:
            return CatalogoCreateSerializer

    @action(detail=True, methods=['get'])
    def categorias(self, request, pk=None):
        """Categorías del catálogo"""
        catalogo = self.get_object()
        categorias = catalogo.categorias.filter(activo=True).annotate(
            total_capitulos=Count('capitulos', filter=Q(capitulos__activo=True), distinct=True),
            total_videos=Count(
                'capitulos__videos',
                filter=Q(
                    capitulos__activo=True,
                    capitulos__videos__activo=True,
                    capitulos__videos__estado='PUBLICADO'
                ),
                distinct=True
            )
        ).order_by('codigo', 'nombre')
        serializer = CategoriaListSerializer(categorias, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def capitulos(self, request, pk=None):
        """Capítulos del catálogo (atravesando categorías)"""
        catalogo = self.get_object()
        qs = Capitulo.objects.filter(
            categoria__catalogo=catalogo, activo=True
        ).annotate(
            total_videos=Count('videos', filter=Q(videos__activo=True, videos__estado='PUBLICADO'), distinct=True)
        ).select_related('categoria__catalogo').order_by('categoria__codigo', 'nombre')
        serializer = CapituloListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


# =======================
#  CAPÍTULOS (FK a Categoría)
# =======================

class CapituloViewSet(viewsets.ModelViewSet):
    """Gestionar capítulos (cada capítulo pertenece a una categoría)"""
    queryset = Capitulo.objects.all().select_related(
        'categoria__catalogo', 'administrador'
    ).annotate(
        total_videos=Count('videos', filter=Q(videos__activo=True, videos__estado='PUBLICADO'), distinct=True)
    ).order_by('categoria__catalogo__nombre', 'categoria__codigo', 'nombre')

    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activo', 'categoria', 'categoria__catalogo', 'administrador']
    search_fields = ['nombre', 'descripcion', 'categoria__nombre', 'categoria__catalogo__nombre']
    ordering_fields = ['nombre', 'fecha_creacion', 'categoria__codigo']
    ordering = ['categoria__catalogo__nombre', 'categoria__codigo', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return CapituloListSerializer
        elif self.action == 'retrieve':
            return CapituloDetailSerializer
        else:
            return CapituloCreateSerializer

    @action(detail=True, methods=['get'])
    def videos(self, request, pk=None):
        """Videos publicados de un capítulo"""
        capitulo = self.get_object()
        videos = capitulo.videos.filter(activo=True, estado='PUBLICADO').order_by('titulo')
        serializer = VideoListSerializer(videos, many=True, context={'request': request})
        return Response(serializer.data)


# =======================
#  VIDEOS (FK a Capítulo)
# =======================

class VideoViewSet(VideoProcessingMixin, viewsets.ModelViewSet):
    """Subida y moderación de videos"""
    queryset = Video.objects.all().select_related(
        'capitulo__categoria__catalogo', 'administrador', 'autor'
    ).annotate(
        total_likes=Count('likes', distinct=True),
        total_comentarios=Count('comentarios', filter=Q(comentarios__activo=True), distinct=True),
        total_guardados=Count('guardados', distinct=True),
        total_compartidas=Count('compartidas', distinct=True)
    ).order_by(
        'capitulo__categoria__catalogo__nombre',
        'capitulo__categoria__codigo',
        'capitulo__nombre',
        'titulo'
    )

    parser_classes = [MultiPartParser, FormParser]
    # Accept JSON as well so clients can PATCH/PUT with application/json
    parser_classes += [JSONParser]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'activo', 'estado', 'capitulo',
        'capitulo__categoria', 'capitulo__categoria__catalogo',
        'administrador', 'autor'
    ]
    search_fields = [
        'titulo', 'descripcion',
        'capitulo__nombre',
        'capitulo__categoria__nombre',
        'capitulo__categoria__catalogo__nombre'
    ]
    ordering_fields = ['titulo', 'fecha_creacion', 'visualizaciones']
    ordering = [
        'capitulo__categoria__catalogo__nombre',
        'capitulo__categoria__codigo',
        'capitulo__nombre',
        'titulo'
    ]

    def get_permissions(self):
        if self.action in [
            'create', 'incrementar_visualizaciones', 'actualizar_progreso',
            'toggle_like', 'toggle_save', 'toggle_share', 'increment_shares', 'comentarios'
        ]:
            return [IsAuthenticated()]
        if self.action in ['approve', 'publish', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return VideoListSerializer
        elif self.action == 'retrieve':
            return VideoDetailSerializer
        else:
            return VideoCreateSerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        video = self.get_object()
        user = self.request.user
        if getattr(user, 'rol', '').upper() == 'ADMIN':
            serializer.save()
        else:
            if video.autor_id == user.id and video.estado == 'REVISION':
                serializer.save()
            else:
                raise permissions.PermissionDenied("No tienes permisos para modificar este video.")

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminRole])
    def approve(self, request, pk=None):
        """Aprobar/publicar un video"""
        video = self.get_object()
        if video.estado == 'PUBLICADO':
            return Response({'detail': 'El video ya está publicado.'}, status=status.HTTP_400_BAD_REQUEST)
        video.estado = 'PUBLICADO'
        video.administrador = request.user
        video.fecha_publicacion = timezone.now()
        video.save(update_fields=['estado', 'administrador', 'fecha_publicacion'])
        return Response({'detail': 'Video aprobado y publicado.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminRole])
    def scan_content(self, request, pk=None):
        """
        Escaneo inteligente del contenido de video usando análisis visual.
        Extrae frames del video y analiza:
        - Movimiento rápido/intenso (proxy para violencia)
        - Tonos rojos intensos (proxy para sangre)
        - Análisis de texto (título/descripción)
        
        Requiere OpenCV (cv2) y numpy instalados.
        """
        video = self.get_object()
        
        try:
            import cv2
            import numpy as np
            import os
        except ImportError:
            return Response({
                'error': 'OpenCV no está instalado. Instalar con: pip install opencv-python',
                'video_id': video.id,
                'summary': 'Error: librerías requeridas no disponibles'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Verificar que existe el archivo de video
        if not video.archivo_video:
            return Response({
                'error': 'El video no tiene archivo asociado',
                'video_id': video.id,
                'summary': 'No se puede escanear: archivo de video no encontrado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        video_path = video.archivo_video.path
        if not os.path.exists(video_path):
            return Response({
                'error': 'Archivo de video no encontrado en el sistema',
                'video_id': video.id,
                'summary': 'Error: archivo no accesible'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Análisis de video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return Response({
                'error': 'No se puede abrir el archivo de video',
                'video_id': video.id,
                'summary': 'Error al procesar el video'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Muestrear 10 frames distribuidos uniformemente
        sample_count = min(10, total_frames)
        frame_indices = np.linspace(0, total_frames - 1, sample_count, dtype=int)
        
        motion_scores = []
        red_intensities = []
        prev_frame = None
        
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if not ret:
                continue
            
            # Analizar tono rojo (sangre/violencia proxy)
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            # Rango de rojos (dos rangos porque el rojo cruza el 0 en HSV)
            lower_red1 = np.array([0, 50, 50])
            upper_red1 = np.array([10, 255, 255])
            lower_red2 = np.array([170, 50, 50])
            upper_red2 = np.array([180, 255, 255])
            mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
            mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
            red_mask = cv2.bitwise_or(mask1, mask2)
            red_ratio = np.sum(red_mask > 0) / red_mask.size
            red_intensities.append(red_ratio)
            
            # Analizar movimiento (diferencia entre frames)
            if prev_frame is not None:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
                diff = cv2.absdiff(prev_gray, gray)
                motion = np.mean(diff) / 255.0
                motion_scores.append(motion)
            prev_frame = frame.copy()
        
        cap.release()
        
        # Calcular métricas
        avg_motion = np.mean(motion_scores) if motion_scores else 0
        max_motion = np.max(motion_scores) if motion_scores else 0
        avg_red = np.mean(red_intensities) if red_intensities else 0
        max_red = np.max(red_intensities) if red_intensities else 0
        
        # Análisis textual (complementario)
        text = f"{video.titulo or ''} {video.descripcion or ''}".lower()
        violent_kws = ['violenc', 'fight', 'attack', 'gun', 'knife', 'shoot', 'assault', 'war', 'battle', 'kill', 'pelea', 'golpe', 'lucha']
        adult_kws = ['sex', 'sexual', 'porn', 'nude', 'nudity', 'xxx', 'erotic', 'desnud']
        blood_kws = ['blood', 'bleed', 'gore', 'gory', 'sangre', 'sangrien']
        inappropriate_kws = ['drug', 'drugs', 'intox', 'self-harm', 'suicide', 'droga']
        
        text_violent = any(kw in text for kw in violent_kws)
        text_adult = any(kw in text for kw in adult_kws)
        text_blood = any(kw in text for kw in blood_kws)
        text_inapp = any(kw in text for kw in inappropriate_kws)
        
        # Scoring combinado (visual + textual)
        violent_score = min(1.0, (max_motion * 2.0 + (0.3 if text_violent else 0)))
        blood_score = min(1.0, (max_red * 10.0 + (0.3 if text_blood else 0)))
        adult_score = 0.3 if text_adult else 0.0
        inapp_score = 0.3 if text_inapp else 0.0
        
        result = {
            'video_id': video.id,
            'frames_analyzed': len(frame_indices),
            'visual_metrics': {
                'avg_motion': round(avg_motion, 3),
                'max_motion': round(max_motion, 3),
                'avg_red_intensity': round(avg_red, 3),
                'max_red_intensity': round(max_red, 3),
            },
            'violent': {
                'flag': violent_score > 0.3,
                'score': round(violent_score, 2),
                'matches': [f'Movimiento alto: {max_motion:.2f}'] if max_motion > 0.15 else [],
            },
            'adult': {
                'flag': adult_score > 0.2,
                'score': round(adult_score, 2),
                'matches': ['Palabras clave en texto'] if text_adult else [],
            },
            'blood': {
                'flag': blood_score > 0.3,
                'score': round(blood_score, 2),
                'matches': [f'Tonos rojos intensos: {max_red:.2f}'] if max_red > 0.03 else [],
            },
            'inappropriate': {
                'flag': inapp_score > 0.2,
                'score': round(inapp_score, 2),
                'matches': ['Palabras clave en texto'] if text_inapp else [],
            },
        }
        
        # Resumen
        notes = []
        if result['violent']['flag']:
            notes.append(f"⚠️ VIOLENCIA detectada (score {result['violent']['score']}) - movimiento intenso y/o palabras clave")
        if result['blood']['flag']:
            notes.append(f"⚠️ SANGRE/GORE detectada (score {result['blood']['score']}) - tonos rojos intensos")
        if result['adult']['flag']:
            notes.append(f"⚠️ Contenido ADULTO detectado (score {result['adult']['score']})")
        if result['inappropriate']['flag']:
            notes.append(f"⚠️ Contenido INAPROPIADO detectado (score {result['inappropriate']['score']})")
        
        if not notes:
            notes.append('✅ No se detectaron señales preocupantes en el análisis visual y textual')
        
        result['summary'] = ' | '.join(notes)
        
        return Response(result)

    @action(detail=True, methods=['post'])
    def incrementar_visualizaciones(self, request, pk=None):
        video = self.get_object()
        video.incrementar_visualizaciones()
        if request.user.is_authenticated:
            visualizacion, created = VisualizacionVideo.objects.get_or_create(
                video=video, usuario=request.user
            )
            if not created:
                visualizacion.fecha_visualizacion = timezone.now()
                visualizacion.save()
        return Response({'visualizaciones': video.visualizaciones})

    @action(detail=True, methods=['post'])
    def actualizar_progreso(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({'error': 'Usuario no autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        video = self.get_object()
        progreso = request.data.get('progreso', 0)
        try:
            progreso = float(progreso)
        except (TypeError, ValueError):
            return Response({'error': 'El progreso debe ser numérico'}, status=status.HTTP_400_BAD_REQUEST)
        if not (0 <= progreso <= 100):
            return Response({'error': 'El progreso debe estar entre 0 y 100'}, status=status.HTTP_400_BAD_REQUEST)

        visualizacion, created = VisualizacionVideo.objects.get_or_create(
            video=video, usuario=request.user,
            defaults={'progreso': progreso, 'completado': progreso >= 90}
        )
        if not created:
            visualizacion.progreso = progreso
            visualizacion.completado = progreso >= 90
            visualizacion.save()

        serializer = VisualizacionVideoSerializer(visualizacion, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_like(self, request, pk=None):
        video = self.get_object()
        like, created = LikeVideo.objects.get_or_create(video=video, usuario=request.user)
        if not created:
            like.delete()
            liked = False
        else:
            liked = True
        total_likes = video.likes.count()
        return Response({'liked': liked, 'total_likes': total_likes})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_save(self, request, pk=None):
        video = self.get_object()
        guardado, created = VideoGuardado.objects.get_or_create(video=video, usuario=request.user)
        if not created:
            guardado.delete()
            saved = False
        else:
            saved = True
        return Response({'saved': saved})

    @action(detail=True, methods=['post'])
    def increment_shares(self, request, pk=None):
        video = self.get_object()
        tipo = request.data.get('tipo', 'LINK')
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip_address:
            ip_address = ip_address.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        CompartirVideo.objects.create(
            video=video,
            usuario=request.user if request.user.is_authenticated else None,
            tipo=tipo,
            ip_address=ip_address
        )
        total_shares = video.compartidas.count()
        return Response({'total_shares': total_shares})

    @action(detail=True, methods=['get', 'post'])
    def comentarios(self, request, pk=None):
        video = self.get_object()
        if request.method == 'GET':
            comentarios = video.comentarios.filter(
                activo=True, comentario_padre__isnull=True
            ).annotate(
                total_likes=Count('likes_comentario')
            ).order_by('-fecha_creacion')
            serializer = ComentarioVideoSerializer(comentarios, many=True, context={'request': request})
            return Response(serializer.data)

        if not request.user.is_authenticated:
            return Response({'error': 'Usuario no autenticado'}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data.copy()
        data['video'] = video.id
        serializer = ComentarioCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            comentario = serializer.save()
            response_serializer = ComentarioVideoSerializer(comentario, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminRole])
    def estadisticas(self, request):
        """Obtener estadísticas de videos para el dashboard admin"""
        total_videos = Video.objects.count()
        videos_pendientes = Video.objects.filter(estado='REVISION').count()
        videos_aprobados = Video.objects.filter(estado='PUBLICADO').count()
        videos_rechazados = Video.objects.filter(estado='ARCHIVADO').count()
        
        return Response({
            'total_videos': total_videos,
            'videos_pendientes': videos_pendientes,
            'videos_aprobados': videos_aprobados,
            'videos_rechazados': videos_rechazados,
        })


# =======================
#  API PÚBLICA
# =======================

class CategoriaPublicaViewSet(viewsets.ReadOnlyModelViewSet):
    """Listado público de categorías activas"""
    queryset = Categoria.objects.filter(activo=True).select_related(
        'catalogo'
    ).annotate(
        total_capitulos=Count('capitulos', filter=Q(capitulos__activo=True), distinct=True),
        total_videos=Count(
            'capitulos__videos',
            filter=Q(
                capitulos__activo=True,
                capitulos__videos__activo=True,
                capitulos__videos__estado='PUBLICADO'
            ),
            distinct=True
        )
    ).order_by('catalogo__nombre', 'codigo')

    serializer_class = CategoriaListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'descripcion', 'catalogo__nombre']
    ordering_fields = ['codigo', 'nombre', 'catalogo__nombre']
    ordering = ['catalogo__nombre', 'codigo']


class VideoPublicoViewSet(viewsets.ReadOnlyModelViewSet):
    """Videos públicos publicados"""
    queryset = Video.objects.filter(
        activo=True,
        estado='PUBLICADO',
        capitulo__activo=True,
        capitulo__categoria__activo=True,
        capitulo__categoria__catalogo__activo=True
    ).select_related(
        'capitulo__categoria__catalogo'
    ).annotate(
        total_likes=Count('likes', distinct=True),
        total_comentarios=Count('comentarios', filter=Q(comentarios__activo=True), distinct=True),
        total_guardados=Count('guardados', distinct=True),
        total_compartidas=Count('compartidas', distinct=True)
    ).order_by('-fecha_publicacion')

    serializer_class = VideoPublicoSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['capitulo__categoria__catalogo']
    search_fields = [
        'titulo', 'descripcion',
        'capitulo__nombre',
        'capitulo__categoria__nombre',
        'capitulo__categoria__catalogo__nombre'
    ]
    ordering_fields = ['fecha_publicacion', 'visualizaciones', 'titulo']
    ordering = ['-fecha_publicacion']

    def list(self, request, *args, **kwargs):
        """
        Override list para aplicar ranking de IA si el usuario está autenticado.
        Si el usuario está autenticado y hay modelo disponible, reordena los videos
        según el score de recomendación (estilo TikTok).
        """
        # Obtener queryset base (con filtros aplicados)
        queryset = self.filter_queryset(self.get_queryset())
        
        # Si el usuario está autenticado, intentar rankear con IA
        if request.user.is_authenticated:
            try:
                from IA.inference import rank_videos_for_user
                
                # Obtener IDs de videos del queryset
                video_ids = list(queryset.values_list('id', flat=True))
                
                if video_ids:
                    # Rankear videos usando el modelo IA
                    ranked_ids = rank_videos_for_user(
                        user_id=request.user.id,
                        video_ids=video_ids,
                        model_path='backend/IA/tf_saved_model/'
                    )
                    
                    # Reordenar queryset según ranking IA
                    # Crear diccionario de posición para cada video
                    id_to_position = {vid: pos for pos, vid in enumerate(ranked_ids)}
                    
                    # Convertir queryset a lista y ordenar
                    videos_list = list(queryset)
                    videos_list.sort(key=lambda v: id_to_position.get(v.id, len(ranked_ids)))
                    
                    # Paginar
                    page = self.paginate_queryset(videos_list)
                    if page is not None:
                        serializer = self.get_serializer(page, many=True)
                        return self.get_paginated_response(serializer.data)
                    
                    serializer = self.get_serializer(videos_list, many=True)
                    return Response(serializer.data)
                    
            except Exception as e:
                # Si falla el ranking IA, continuar con orden normal
                print(f"Error al rankear con IA: {e}")
                pass
        
        # Flujo normal (usuarios no autenticados o si falla IA)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def incrementar_visualizaciones(self, request, pk=None):
        video = self.get_object()
        video.incrementar_visualizaciones()
        return Response({'visualizaciones': video.visualizaciones})

    @action(detail=False, methods=['get'])
    def populares(self, request):
        videos = self.get_queryset().order_by('-visualizaciones')[:10]
        serializer = self.get_serializer(videos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recientes(self, request):
        videos = self.get_queryset().order_by('-fecha_publicacion')[:10]
        serializer = self.get_serializer(videos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_like(self, request, pk=None):
        video = self.get_object()
        like, created = LikeVideo.objects.get_or_create(video=video, usuario=request.user)
        if not created:
            like.delete()
            liked = False
        else:
            liked = True
        total_likes = video.likes.count()
        return Response({'liked': liked, 'total_likes': total_likes})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_save(self, request, pk=None):
        video = self.get_object()
        guardado, created = VideoGuardado.objects.get_or_create(video=video, usuario=request.user)
        if not created:
            guardado.delete()
            saved = False
        else:
            saved = True
        return Response({'saved': saved})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_share(self, request, pk=None):
        """Toggle compartir - funciona como like/unlike"""
        video = self.get_object()
        tipo = request.data.get('tipo', 'LINK')
        
        # Buscar si el usuario ya compartió este video
        existing_share = CompartirVideo.objects.filter(
            video=video,
            usuario=request.user
        ).first()
        
        if existing_share:
            # Ya compartió, entonces "descompartir"
            existing_share.delete()
            shared = False
        else:
            # No ha compartido, crear nuevo compartir
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
            if ip_address:
                ip_address = ip_address.split(',')[0]
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            
            CompartirVideo.objects.create(
                video=video,
                usuario=request.user,
                tipo=tipo,
                ip_address=ip_address
            )
            shared = True
        
        total_shares = video.compartidas.count()
        return Response({
            'shared': shared,
            'total_shares': total_shares
        })

    @action(detail=True, methods=['post'])
    def increment_shares(self, request, pk=None):
        video = self.get_object()
        tipo = request.data.get('tipo', 'LINK')
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip_address:
            ip_address = ip_address.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        CompartirVideo.objects.create(
            video=video,
            usuario=request.user if request.user.is_authenticated else None,
            tipo=tipo,
            ip_address=ip_address
        )
        total_shares = video.compartidas.count()
        return Response({'total_shares': total_shares})

    @action(detail=True, methods=['get', 'post'])
    def comentarios(self, request, pk=None):
        video = self.get_object()
        if request.method == 'GET':
            comentarios = video.comentarios.filter(
                activo=True, comentario_padre__isnull=True
            ).annotate(
                total_likes=Count('likes_comentario')
            ).order_by('-fecha_creacion')
            serializer = ComentarioVideoSerializer(comentarios, many=True, context={'request': request})
            return Response(serializer.data)

        if not request.user.is_authenticated:
            return Response({'error': 'Usuario no autenticado'}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data.copy()
        data['video'] = video.id
        serializer = ComentarioCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            comentario = serializer.save()
            response_serializer = ComentarioVideoSerializer(comentario, context={'request': request})
            # Devolver también el total actualizado de comentarios
            total_comentarios = video.comentarios.filter(activo=True).count()
            response_data = response_serializer.data
            response_data['total_comentarios'] = total_comentarios
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def recomendaciones(self, request):
        """
        Recomendaciones personalizadas basadas en ML (TensorFlow).
        Usa el modelo entrenado para sugerir videos según historial del usuario.
        """
        try:
            from IA.inference import get_recommendations_for_user
            
            # Obtener parámetros
            limit = int(request.query_params.get('limit', 10))
            limit = min(limit, 50)  # Máximo 50 recomendaciones
            
            # Obtener recomendaciones del modelo
            recommended_ids = get_recommendations_for_user(
                user_id=request.user.id,
                top_n=limit,
                model_path='backend/IA/tf_saved_model/',
                exclude_interacted=True
            )
            
            if not recommended_ids:
                # Fallback: videos populares recientes
                videos = self.get_queryset().order_by('-visualizaciones', '-fecha_publicacion')[:limit]
            else:
                # Obtener videos en el orden recomendado
                videos = []
                for vid in recommended_ids:
                    try:
                        video = self.get_queryset().get(id=vid)
                        videos.append(video)
                    except Video.DoesNotExist:
                        continue
            
            serializer = self.get_serializer(videos, many=True)
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'message': 'Recomendaciones personalizadas basadas en tu historial' if recommended_ids else 'Videos populares (modelo no disponible)'
            })
            
        except Exception as e:
            # En caso de error, devolver videos populares
            videos = self.get_queryset().order_by('-visualizaciones', '-fecha_publicacion')[:limit]
            serializer = self.get_serializer(videos, many=True)
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'message': f'Videos populares (error en recomendaciones: {str(e)})'
            })

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def busqueda_semantica(self, request):
        """
        Búsqueda semántica con IA usando Groq.
        Entiende el significado y contexto de las consultas en lenguaje natural.
        
        Ejemplo de consultas:
        - "videos sobre matemáticas avanzadas"
        - "conferencias de física cuántica"
        - "tutoriales de programación para principiantes"
        """
        from .semantic_search import SemanticSearchService, perform_traditional_search
        
        query = request.data.get('query', '').strip()
        if not query:
            return Response({
                'error': 'Se requiere una consulta de búsqueda',
                'results': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Inicializar servicio de búsqueda semántica
        semantic_service = SemanticSearchService()
        
        # Verificar si el servicio está disponible
        if not semantic_service.is_available():
            return Response({
                'error': 'API key de Groq no configurada',
                'message': 'Configure GROQ_API_KEY en las variables de entorno',
                'results': []
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Realizar búsqueda semántica
        result = semantic_service.search(query, self.get_queryset())
        
        # Si la búsqueda semántica falló, usar búsqueda tradicional como fallback
        if not result['success']:
            queryset = perform_traditional_search(self.get_queryset(), query)
            serializer = self.get_serializer(queryset, many=True)
            
            # Determinar mensaje según tipo de error
            error_type = result.get('error_type', 'unknown')
            if error_type == 'import_error':
                message = 'El paquete groq no está instalado. Usando búsqueda tradicional.'
            elif error_type == 'groq_service_unavailable':
                message = 'El servicio de IA está temporalmente no disponible. Usando búsqueda tradicional.'
            elif error_type == 'rate_limit':
                message = 'Límite de uso del API excedido. Usando búsqueda tradicional.'
            elif error_type == 'timeout':
                message = 'Tiempo de espera agotado. Usando búsqueda tradicional.'
            else:
                message = 'Servicio de IA no disponible. Usando búsqueda tradicional.'
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'query': query,
                'message': message,
                'fallback': True,
                'error_type': error_type
            })
        
        # Búsqueda semántica exitosa
        video_ids = result.get('video_ids', [])
        reasoning = result.get('reasoning', '')
        
        if not video_ids:
            return Response({
                'results': [],
                'count': 0,
                'message': 'No se encontraron videos relevantes para tu consulta',
                'reasoning': reasoning
            })
        
        # Obtener videos en el orden recomendado
        videos_dict = {v.id: v for v in self.get_queryset().filter(id__in=video_ids)}
        ordered_videos = [videos_dict[vid] for vid in video_ids if vid in videos_dict]
        
        # Serializar
        serializer = self.get_serializer(ordered_videos, many=True)
        
        return Response({
            'results': serializer.data,
            'count': len(serializer.data),
            'query': query,
            'reasoning': reasoning,
            'message': f'Se encontraron {len(serializer.data)} videos relevantes usando búsqueda semántica con IA'
        })


# =======================
#  HISTORIAL / GUARDADOS / COMENTARIOS
# =======================

class VisualizacionVideoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VisualizacionVideoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['completado']
    ordering_fields = ['fecha_visualizacion', 'progreso']
    ordering = ['-fecha_visualizacion']

    def get_queryset(self):
        return VisualizacionVideo.objects.filter(
            usuario=self.request.user
        ).select_related('video__capitulo__categoria__catalogo')

    @action(detail=False, methods=['get'])
    def en_progreso(self, request):
        visualizaciones = self.get_queryset().filter(
            completado=False, progreso__gt=0
        ).order_by('-fecha_visualizacion')[:10]
        serializer = self.get_serializer(visualizaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def completados(self, request):
        visualizaciones = self.get_queryset().filter(
            completado=True
        ).order_by('-fecha_visualizacion')[:20]
        serializer = self.get_serializer(visualizaciones, many=True)
        return Response(serializer.data)


class ComentarioVideoViewSet(viewsets.ModelViewSet):
    serializer_class = ComentarioVideoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['video', 'activo']
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        return ComentarioVideo.objects.filter(
            activo=True
        ).annotate(
            total_likes=Count('likes_comentario')
        ).select_related('usuario', 'video')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ComentarioCreateSerializer
        return ComentarioVideoSerializer

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.usuario != self.request.user:
            raise permissions.PermissionDenied("Solo puedes editar tus propios comentarios")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.usuario != self.request.user:
            raise permissions.PermissionDenied("Solo puedes eliminar tus propios comentarios")
        instance.activo = False
        instance.save()

    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        comentario = self.get_object()
        like, created = LikeComentario.objects.get_or_create(
            comentario=comentario,
            usuario=request.user
        )
        if not created:
            like.delete()
            liked = False
        else:
            liked = True
        total_likes = comentario.likes_comentario.count()
        return Response({'liked': liked, 'total_likes': total_likes})


class VideoGuardadoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VideoGuardadoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        return VideoGuardado.objects.filter(
            usuario=self.request.user
        ).select_related('video__capitulo__categoria__catalogo')

    @action(detail=False, methods=['delete'])
    def limpiar_todos(self, request):
        count = self.get_queryset().count()
        self.get_queryset().delete()
        return Response({'message': f'Se eliminaron {count} videos guardados'})


class LikeVideoViewSet(viewsets.ReadOnlyModelViewSet):
    """Listado de videos con like del usuario autenticado"""
    serializer_class = VideoListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        # Obtener los IDs de videos a los que el usuario ha dado like
        liked_video_ids = LikeVideo.objects.filter(
            usuario=self.request.user
        ).values_list('video_id', flat=True)
        
        # Retornar los videos con anotaciones
        return Video.objects.filter(
            id__in=liked_video_ids,
            activo=True
        ).select_related(
            'capitulo__categoria__catalogo', 'administrador', 'autor'
        ).annotate(
            total_likes=Count('likes', distinct=True),
            total_comentarios=Count('comentarios', filter=Q(comentarios__activo=True), distinct=True),
            total_guardados=Count('guardados', distinct=True),
            total_compartidas=Count('compartidas', distinct=True)
        ).order_by('-likes__fecha_creacion')


class CompartirVideoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CompartirVideoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tipo', 'video']
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        return CompartirVideo.objects.filter(
            usuario=self.request.user
        ).select_related('video')

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        queryset = self.get_queryset()
        stats = {
            'total': queryset.count(),
            'por_tipo': {},
            'videos_mas_compartidos': []
        }
        for tipo, _ in CompartirVideo.TIPO_COMPARTIR_CHOICES:
            stats['por_tipo'][tipo] = queryset.filter(tipo=tipo).count()
        videos_compartidos = queryset.values(
            'video__id', 'video__titulo'
        ).annotate(
            total=Count('id')
        ).order_by('-total')[:5]
        stats['videos_mas_compartidos'] = list(videos_compartidos)
        return Response(stats)


class ReportesView(viewsets.ViewSet):
    """Vista para reportes administrativos"""
    permission_classes = [IsAdminRole]

    @action(detail=False, methods=['get'])
    def reportes(self, request):
        # Videos por mes
        videos_por_mes = Video.objects.filter(
            activo=True,
            estado='PUBLICADO'
        ).annotate(
            mes=TruncMonth('fecha_creacion')
        ).values('mes').annotate(
            cantidad=Count('id')
        ).order_by('mes')

        # Reacciones por tipo
        reacciones_por_tipo = [
            {'tipo': 'likes', 'cantidad': LikeVideo.objects.count()},
            {'tipo': 'comentarios', 'cantidad': ComentarioVideo.objects.count()},
            {'tipo': 'compartidos', 'cantidad': CompartirVideo.objects.count()},
        ]

        # Videos por categoria
        videos_por_categoria = Categoria.objects.filter(
            activo=True
        ).annotate(
            cantidad_videos=Count(
                'capitulos__videos',
                filter=Q(
                    capitulos__activo=True,
                    capitulos__videos__activo=True,
                    capitulos__videos__estado='PUBLICADO'
                )
            )
        ).values('nombre', 'cantidad_videos').order_by('-cantidad_videos')

        # Totales
        total_videos = Video.objects.filter(activo=True, estado='PUBLICADO').count()
        total_usuarios = User.objects.count()
        total_visualizaciones = VisualizacionVideo.objects.count()
        total_comentarios = ComentarioVideo.objects.count()
        total_likes = LikeVideo.objects.count()
        total_compartidos = CompartirVideo.objects.count()

        data = {
            'videos_por_mes': list(videos_por_mes),
            'reacciones_por_tipo': reacciones_por_tipo,
            'videos_por_categoria': list(videos_por_categoria),
            'total_videos': total_videos,
            'total_usuarios': total_usuarios,
            'total_visualizaciones': total_visualizaciones,
            'total_comentarios': total_comentarios,
            'total_likes': total_likes,
            'total_compartidos': total_compartidos,
        }

        return Response(data)
