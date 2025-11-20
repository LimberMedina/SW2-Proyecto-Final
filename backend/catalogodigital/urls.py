from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para admin (autenticado)
admin_router = DefaultRouter()
admin_router.register(r'categorias', views.CategoriaViewSet)
admin_router.register(r'catalogos', views.CatalogoViewSet)
admin_router.register(r'capitulos', views.CapituloViewSet)
admin_router.register(r'videos', views.VideoViewSet, basename='video')
admin_router.register(r'visualizaciones', views.VisualizacionVideoViewSet, basename='visualizacionvideo')
admin_router.register(r'comentarios', views.ComentarioVideoViewSet, basename='comentariovideo')
admin_router.register(r'videos-guardados', views.VideoGuardadoViewSet, basename='videoguardado')
admin_router.register(r'videos-liked', views.LikeVideoViewSet, basename='videoliked')
admin_router.register(r'compartidas', views.CompartirVideoViewSet, basename='compartirvideo')

# Router para API pública
public_router = DefaultRouter()
public_router.register(r'categorias', views.CategoriaPublicaViewSet)
public_router.register(r'videos', views.VideoPublicoViewSet, basename='videopublico')

urlpatterns = [
    # URLs para administración (requieren autenticación)
    path('admin/', include(admin_router.urls)),
    path('admin/reportes/', views.ReportesView.as_view({'get': 'reportes'}), name='admin-reportes'),
    
    # URLs públicas (sin autenticación)
    path('public/', include(public_router.urls)),
    
    # URLs específicas para comentarios (acceso directo)
    path('comentarios/<int:pk>/toggle-like/', 
         views.ComentarioVideoViewSet.as_view({'post': 'toggle_like'}), 
         name='comentario-toggle-like'),
]