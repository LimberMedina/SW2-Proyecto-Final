from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnuncioViewSet, AnuncioPublicoViewSet

router = DefaultRouter()
# Rutas admin (restringidas por permisos del viewset)
router.register(r'catalogodigital/admin/anuncios', AnuncioViewSet, basename='admin-anuncios')
# Rutas públicas (solo lectura; vigentes)
router.register(r'catalogodigital/public/anuncios', AnuncioPublicoViewSet, basename='public-anuncios')

urlpatterns = [
    path('', include(router.urls)),
]
