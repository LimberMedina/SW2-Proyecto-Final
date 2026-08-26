# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLES = (
        ("ADMIN", "ADMIN"),
        ("USER", "USER"),
    )

    # Campos requeridos en español
    
    # AbstractUser ya trae: username, first_name, last_name, email, password, is_active, etc.
    # Forzamos email único
    email = models.EmailField(unique=True)
    rol = models.CharField(max_length=10, choices=ROLES, default="USER")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.username} - {self.first_name} {self.last_name}"


class PreferenciasUsuario(models.Model):
    """Preferencias y configuración del usuario"""
    THEME_CHOICES = [
        ('light', 'Claro'),
        ('dark', 'Oscuro'),
        ('auto', 'Automático'),
    ]
    
    LANGUAGE_CHOICES = [
        ('es', 'Español'),
        ('en', 'English'),
        ('pt', 'Português'),
    ]
    
    QUALITY_CHOICES = [
        ('auto', 'Automática'),
        ('1080p', '1080p (HD)'),
        ('720p', '720p'),
        ('480p', '480p'),
        ('360p', '360p'),
    ]
    
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferencias')
    
    # Notificaciones
    notif_email = models.BooleanField(default=True, verbose_name="Notificaciones por email")
    notif_push = models.BooleanField(default=False, verbose_name="Notificaciones push")
    notif_nuevos_videos = models.BooleanField(default=True, verbose_name="Notificar nuevos videos")
    notif_comentarios = models.BooleanField(default=True, verbose_name="Notificar comentarios")
    
    # Privacidad
    perfil_visible = models.BooleanField(default=True, verbose_name="Perfil público")
    mostrar_email = models.BooleanField(default=False, verbose_name="Mostrar email")
    mostrar_actividad = models.BooleanField(default=True, verbose_name="Mostrar actividad")
    
    # Reproducción
    autoplay = models.BooleanField(default=False, verbose_name="Reproducción automática")
    calidad_video = models.CharField(max_length=10, choices=QUALITY_CHOICES, default='auto', verbose_name="Calidad de video")
    subtitulos_auto = models.BooleanField(default=False, verbose_name="Subtítulos automáticos")
    
    # Apariencia
    tema = models.CharField(max_length=10, choices=THEME_CHOICES, default='light', verbose_name="Tema")
    idioma = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='es', verbose_name="Idioma")
    
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Preferencia de Usuario"
        verbose_name_plural = "Preferencias de Usuarios"
    
    def __str__(self):
        return f"Preferencias de {self.usuario.username}"
