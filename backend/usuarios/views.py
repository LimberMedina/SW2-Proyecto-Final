# users/views.py
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, viewsets, filters
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from .serializers import RegistroUsuarioSerializer, UsuarioMeSerializer, UsuarioAdminSerializer, PreferenciasUsuarioSerializer
from .models import PreferenciasUsuario

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para login que devuelve tokens + información del usuario
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Si el login fue exitoso, agregar información del usuario
            from django.contrib.auth import authenticate
            username = request.data.get('username')
            password = request.data.get('password')
            
            user = authenticate(username=username, password=password)
            if user:
                user_data = UsuarioMeSerializer(user).data
                response.data['usuario'] = user_data
                
        return response

class RegistroUsuarioView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegistroUsuarioSerializer

    def create(self, request, *args, **kwargs):
        # Creamos el usuario
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generamos tokens JWT
        refresh = RefreshToken.for_user(user)
        data_user = UsuarioMeSerializer(user).data

        return Response(
            {
                "usuario": data_user,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "mensaje": "Usuario registrado correctamente.",
            },
            status=status.HTTP_201_CREATED,
        )


class YoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UsuarioMeSerializer(request.user).data)


class EstadisticasUsuarioView(APIView):
    """Vista para obtener estadísticas del usuario autenticado"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Importar los modelos necesarios
        from catalogodigital.models import (
            ComentarioVideo, LikeVideo, VideoGuardado, 
            VisualizacionVideo, CompartirVideo, Video
        )
        
        # Calcular estadísticas usando related managers
        videos_vistos = VisualizacionVideo.objects.filter(usuario=user).count()
        comentarios_realizados = ComentarioVideo.objects.filter(usuario=user, activo=True).count()
        likes_dados = LikeVideo.objects.filter(usuario=user).count()
        videos_guardados = VideoGuardado.objects.filter(usuario=user).count()
        videos_compartidos = CompartirVideo.objects.filter(usuario=user).count()
        
        # Estadísticas sobre contenido del usuario (recibidas)
        likes_recibidos = LikeVideo.objects.filter(video__autor=user).count()
        comentarios_recibidos = ComentarioVideo.objects.filter(video__autor=user, activo=True).count()
        compartidos_recibidos = CompartirVideo.objects.filter(video__autor=user).count()
        
        # Videos subidos y publicados
        videos_subidos = Video.objects.filter(autor=user).count()
        videos_publicados = Video.objects.filter(autor=user, estado='PUBLICADO').count()
        
        estadisticas = {
            # Acciones del usuario
            'videos_vistos': videos_vistos,
            'comentarios_realizados': comentarios_realizados,
            'likes_dados': likes_dados,
            'videos_con_like': likes_dados,  # Alias para compatibilidad
            'videos_guardados': videos_guardados,
            'videos_compartidos': videos_compartidos,
            
            # Interacciones recibidas
            'likes_recibidos': likes_recibidos,
            'comentarios_recibidos': comentarios_recibidos,
            'compartidos_recibidos': compartidos_recibidos,
            
            # Contenido del usuario
            'videos_subidos': videos_subidos,
            'videos_publicados': videos_publicados,
            'publicaciones_aprobadas': videos_publicados,  # Alias para frontend
            
            # Tiempo y fechas
            'tiempo_total_visto': self._calcular_tiempo_total_visto(user),
            'fecha_registro': user.date_joined.strftime('%B %Y') if user.date_joined else 'Fecha no disponible',
            'ultimo_acceso': user.last_login.strftime('%d/%m/%Y %H:%M') if user.last_login else 'Nunca',
        }
        
        return Response(estadisticas)
    
    def _calcular_tiempo_total_visto(self, user):
        """Calcula el tiempo total de videos vistos por el usuario"""
        from catalogodigital.models import VisualizacionVideo
        
        # progreso es un porcentaje (0-100) del video visto
        qs = VisualizacionVideo.objects.filter(usuario=user).select_related('video')
        total_minutos = 0.0
        
        for v in qs:
            try:
                duracion = v.video.duracion
                if duracion:
                    minutos_video = duracion.total_seconds() / 60.0
                    minutos_vistos = minutos_video * (float(v.progreso) / 100.0)
                    total_minutos += minutos_vistos
            except Exception:
                continue
        
        total_minutos = round(total_minutos, 2)
        horas = int(total_minutos // 60)
        minutos = int(total_minutos % 60)
        
        return {
            'total_minutos': total_minutos,
            'horas': horas,
            'minutos': minutos,
            'texto': f"{horas}h {minutos}m" if horas > 0 else f"{minutos}m"
        }


class PasswordResetRequestView(APIView):
    """Vista para solicitar el reseteo de contraseña"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {'error': 'El email es requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Por seguridad, no revelar si el email existe o no
            return Response(
                {'mensaje': 'Si el email existe, recibirás un enlace para resetear tu contraseña.'},
                status=status.HTTP_200_OK
            )
        
        # Generar token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Construir enlace de reset
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}/"
        
        # Enviar email (en producción usar HTML template)
        try:
            send_mail(
                'Reseteo de Contraseña - Videoteca Digital',
                f'Hola {user.username},\n\n'
                f'Has solicitado resetear tu contraseña.\n\n'
                f'Haz clic en el siguiente enlace para continuar:\n{reset_link}\n\n'
                f'Este enlace expira en 24 horas.\n\n'
                f'Si no solicitaste este cambio, ignora este email.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error enviando email: {e}")
            # En desarrollo, imprimir el link en consola
            print(f"\n=== RESET PASSWORD LINK ===")
            print(f"Usuario: {user.username}")
            print(f"Link: {reset_link}")
            print(f"===========================\n")
        
        return Response(
            {'mensaje': 'Si el email existe, recibirás un enlace para resetear tu contraseña.'},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """Vista para confirmar el reseteo de contraseña con el token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not all([uid, token, new_password]):
            return Response(
                {'error': 'Todos los campos son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'La contraseña debe tener al menos 8 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Enlace inválido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar token
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Enlace inválido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar contraseña
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'mensaje': 'Contraseña actualizada correctamente.'},
            status=status.HTTP_200_OK
        )


class RespaldoInformacionView(APIView):
    """Vista para generar respaldo de información del usuario"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Generar respaldo de datos del usuario en formato JSON"""
        from django.http import JsonResponse
        import json
        from catalogodigital.models import (
            ComentarioVideo, LikeVideo, VideoGuardado, 
            VisualizacionVideo, CompartirVideo, Video
        )
        
        user = request.user
        
        # Recopilar todos los datos del usuario
        respaldo = {
            'usuario': {
                'username': user.username,
                'email': user.email,
                'nombre': user.first_name,
                'apellidos': user.last_name,
                'rol': user.rol,
                'fecha_registro': user.date_joined.isoformat() if user.date_joined else None,
                'ultimo_acceso': user.last_login.isoformat() if user.last_login else None,
            },
            'preferencias': {},
            'actividad': {
                'videos_vistos': [],
                'comentarios': [],
                'likes': [],
                'videos_guardados': [],
                'videos_compartidos': [],
            },
            'contenido_propio': {
                'videos': []
            },
            'estadisticas': {},
        }
        
        # Preferencias
        try:
            preferencias = PreferenciasUsuario.objects.get(usuario=user)
            respaldo['preferencias'] = PreferenciasUsuarioSerializer(preferencias).data
        except PreferenciasUsuario.DoesNotExist:
            pass
        
        # Videos vistos
        visualizaciones = VisualizacionVideo.objects.filter(usuario=user).select_related('video')
        respaldo['actividad']['videos_vistos'] = [
            {
                'video_id': v.video.id,
                'video_titulo': v.video.titulo,
                'progreso': float(v.progreso),
                'fecha': v.fecha_visualizacion.isoformat(),
            }
            for v in visualizaciones
        ]
        
        # Comentarios
        comentarios = ComentarioVideo.objects.filter(usuario=user).select_related('video')
        respaldo['actividad']['comentarios'] = [
            {
                'video_titulo': c.video.titulo,
                'comentario': c.comentario,
                'fecha': c.fecha_comentario.isoformat(),
            }
            for c in comentarios
        ]
        
        # Likes
        likes = LikeVideo.objects.filter(usuario=user).select_related('video')
        respaldo['actividad']['likes'] = [
            {
                'video_titulo': like.video.titulo,
                'fecha': like.fecha_like.isoformat(),
            }
            for like in likes
        ]
        
        # Videos guardados
        guardados = VideoGuardado.objects.filter(usuario=user).select_related('video')
        respaldo['actividad']['videos_guardados'] = [
            {
                'video_titulo': vg.video.titulo,
                'fecha': vg.fecha_guardado.isoformat(),
            }
            for vg in guardados
        ]
        
        # Videos compartidos
        compartidos = CompartirVideo.objects.filter(usuario=user).select_related('video')
        respaldo['actividad']['videos_compartidos'] = [
            {
                'video_titulo': cv.video.titulo,
                'fecha': cv.fecha_compartido.isoformat(),
            }
            for cv in compartidos
        ]
        
        # Videos propios
        videos = Video.objects.filter(autor=user)
        respaldo['contenido_propio']['videos'] = [
            {
                'titulo': video.titulo,
                'descripcion': video.descripcion,
                'estado': video.estado,
                'visualizaciones': video.visualizaciones,
                'fecha_creacion': video.fecha_creacion.isoformat(),
                'fecha_publicacion': video.fecha_publicacion.isoformat() if video.fecha_publicacion else None,
            }
            for video in videos
        ]
        
        # Estadísticas resumidas
        respaldo['estadisticas'] = {
            'total_videos_vistos': visualizaciones.count(),
            'total_comentarios': comentarios.count(),
            'total_likes': likes.count(),
            'total_guardados': guardados.count(),
            'total_compartidos': compartidos.count(),
            'total_videos_subidos': videos.count(),
        }
        
        # Agregar timestamp del respaldo
        from django.utils import timezone
        respaldo['metadata'] = {
            'fecha_respaldo': timezone.now().isoformat(),
            'version': '1.0',
        }
        
        # Retornar como descarga JSON
        response = JsonResponse(respaldo, json_dumps_params={'indent': 2, 'ensure_ascii': False})
        response['Content-Disposition'] = f'attachment; filename="respaldo_{user.username}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json"'
        return response


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para administración de usuarios (solo admin)"""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UsuarioAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined', 'last_login', 'rol']
    filterset_fields = ['rol', 'is_active']

    def get_permissions(self):
        """Solo administradores pueden acceder"""
        return [permissions.IsAdminUser()]

    @action(detail=True, methods=['post'])
    def cambiar_rol(self, request, pk=None):
        """Endpoint para cambiar el rol de un usuario"""
        user = self.get_object()
        nuevo_rol = request.data.get('rol', '').upper()
        
        if nuevo_rol not in ['ADMIN', 'USER']:
            return Response(
                {'error': 'El rol debe ser ADMIN o USER.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.rol = nuevo_rol
        user.save()
        
        return Response(
            {'mensaje': f'Rol actualizado a {nuevo_rol}'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Endpoint para activar/desactivar usuario"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        estado = "activado" if user.is_active else "desactivado"
        return Response(
            {'mensaje': f'Usuario {estado} correctamente.'},
            status=status.HTTP_200_OK
        )


class PreferenciasUsuarioView(APIView):
    """
    Vista para gestionar las preferencias del usuario autenticado.
    GET: Obtener preferencias actuales
    PUT/PATCH: Actualizar preferencias
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Obtener preferencias del usuario"""
        user = request.user
        
        # Obtener o crear preferencias si no existen
        preferencias, created = PreferenciasUsuario.objects.get_or_create(usuario=user)
        
        serializer = PreferenciasUsuarioSerializer(preferencias)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        """Actualizar preferencias del usuario"""
        user = request.user
        
        # Obtener o crear preferencias si no existen
        preferencias, created = PreferenciasUsuario.objects.get_or_create(usuario=user)
        
        serializer = PreferenciasUsuarioSerializer(
            preferencias, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'mensaje': 'Preferencias actualizadas correctamente.',
                    'preferencias': serializer.data
                },
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Actualizar preferencias parcialmente (alias de PUT)"""
        return self.put(request)
