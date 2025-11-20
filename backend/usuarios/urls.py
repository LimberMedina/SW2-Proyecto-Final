# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegistroUsuarioView, YoView, CustomTokenObtainPairView, EstadisticasUsuarioView

urlpatterns = [
    path("registro/", RegistroUsuarioView.as_view(), name="registro"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", YoView.as_view(), name="yo"),
    path("me/estadisticas/", EstadisticasUsuarioView.as_view(), name="estadisticas"),
]
