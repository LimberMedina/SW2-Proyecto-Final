"""
Configuración de la app IA para Django
"""
from django.apps import AppConfig


class IAConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'IA'
    verbose_name = 'Sistema de Recomendaciones IA'
