# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegistroUsuarioView, YoView, CustomTokenObtainPairView, 
    EstadisticasUsuarioView, PasswordResetRequestView, PasswordResetConfirmView,
    UsuarioViewSet, PreferenciasUsuarioView, RespaldoInformacionView
)

router = DefaultRouter()
router.register(r'admin/users', UsuarioViewSet, basename='usuario-admin')

urlpatterns = [
    path("registro/", RegistroUsuarioView.as_view(), name="registro"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", YoView.as_view(), name="yo"),
    path("me/estadisticas/", EstadisticasUsuarioView.as_view(), name="estadisticas"),
    path("me/preferencias/", PreferenciasUsuarioView.as_view(), name="preferencias"),
    path("me/respaldo/", RespaldoInformacionView.as_view(), name="respaldo"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("", include(router.urls)),
]
