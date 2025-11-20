# users/views.py
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegistroUsuarioSerializer, UsuarioMeSerializer

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
