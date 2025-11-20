from rest_framework import viewsets, permissions, filters
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Anuncio
from .serializers import (
    AnuncioListSerializer,
    AnuncioCreateSerializer,
    AnuncioPublicoSerializer,
)


class IsAdminRole(BasePermission):
    """
    Permite acceso si el usuario está autenticado y su rol es ADMIN.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', '').upper() == 'ADMIN'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Lectura requiere autenticación; escritura solo para usuarios con rol ADMIN.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and getattr(request.user, 'rol', '').upper() == 'ADMIN'


class AnuncioViewSet(viewsets.ModelViewSet):
    """
    ENDPOINT ADMIN:
      - Listar/obtener anuncios (autenticados)
      - Crear/editar/eliminar (solo ADMIN)
    Soporta multipart para subir imagen.
    """
    queryset = Anuncio.objects.all().select_related('administrador').order_by('-fecha_inicio', '-fecha_creacion')
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = ['activo', 'administrador']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'fecha_creacion', 'titulo']
    ordering = ['-fecha_inicio', '-fecha_creacion']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return AnuncioListSerializer
        return AnuncioCreateSerializer


class AnuncioPublicoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ENDPOINT PÚBLICO:
      - Solo devuelve anuncios vigentes (activo=True y fecha en rango).
    """
    serializer_class = AnuncioPublicoSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'fecha_creacion', 'titulo']
    ordering = ['-fecha_inicio', '-fecha_creacion']

    def get_queryset(self):
        now = timezone.now()
        return Anuncio.objects.filter(
            activo=True,
            fecha_inicio__lte=now,
            fecha_fin__gte=now
        ).order_by('-fecha_inicio', '-fecha_creacion')
