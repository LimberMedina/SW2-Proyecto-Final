from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


def anuncio_upload_path(instance, filename):
    """
    Ruta para guardar imágenes de anuncios:
    anuncios/<yyyy>/<mm>/<filename>
    """
    now = timezone.now()
    return f"anuncios/{now.year}/{now.month:02d}/{filename}"


class Anuncio(models.Model):
    """
    Anuncios/Publicidades visibles en el catálogo.
    Pueden existir varios anuncios activos a la vez.
    Se consideran vigentes si (activo=True) y now ∈ [fecha_inicio, fecha_fin].
    """
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    imagen = models.ImageField(upload_to=anuncio_upload_path, blank=True, null=True)
    url_destino = models.URLField(blank=True, null=True)

    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()

    activo = models.BooleanField(default=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    administrador = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'rol': 'ADMIN'},
        related_name='anuncios_creados'
    )

    class Meta:
        verbose_name = "Anuncio"
        verbose_name_plural = "Anuncios"
        ordering = ['-fecha_inicio', '-fecha_creacion']

    def __str__(self):
        return self.titulo

    def es_vigente(self) -> bool:
        """True si el anuncio está ACTIVO y la fecha actual está entre inicio y fin (inclusive)."""
        if not self.activo:
            return False
        now = timezone.now()
        return self.fecha_inicio <= now <= self.fecha_fin
