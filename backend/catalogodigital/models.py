from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.db.models import Count, Q

User = get_user_model()


class Catalogo(models.Model):
    TIPO_CHOICES = [
        ('FISICO', 'Físico'),
        ('DIGITAL', 'Digital'),
    ]
    
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='DIGITAL')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    administrador = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'rol': 'ADMIN'},
        related_name='catalogos_creados'
    )

    class Meta:
        verbose_name = "Catálogo"
        verbose_name_plural = "Catálogos"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre}"

    def total_categorias(self):
        return self.categorias.filter(activo=True).count()

    def total_capitulos(self):
        return self.categorias.filter(activo=True).aggregate(
            c=Count('capitulos', filter=Q(capitulos__activo=True), distinct=True)
        )['c'] or 0

    def total_videos(self):
        return self.categorias.filter(activo=True).aggregate(
            v=Count(
                'capitulos__videos',
                filter=Q(capitulos__activo=True, capitulos__videos__activo=True),
                distinct=True
            )
        )['v'] or 0


class Categoria(models.Model):
    codigo = models.CharField(max_length=20, help_text="Código único dentro del catálogo")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    catalogo = models.ForeignKey(
        Catalogo,
        on_delete=models.CASCADE,
        related_name='categorias'
    )

    administrador = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'rol': 'ADMIN'},
        related_name='categorias_creadas'
    )

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        unique_together = ['catalogo', 'codigo']
        ordering = ['catalogo__nombre', 'codigo', 'nombre']

    def __str__(self):
        return f"{self.catalogo.nombre} - {self.codigo} - {self.nombre}"

    def total_capitulos(self):
        return self.capitulos.filter(activo=True).count()

    def total_videos(self):
        return self.capitulos.filter(activo=True).aggregate(
            v=Count('videos', filter=Q(videos__activo=True), distinct=True)
        )['v'] or 0


class Capitulo(models.Model):
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name='capitulos'
    )

    administrador = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'rol': 'ADMIN'},
        related_name='capitulos_creados'
    )

    class Meta:
        verbose_name = "Capítulo"
        verbose_name_plural = "Capítulos"
      
        ordering = [
            'categoria__catalogo__nombre',
            'categoria__codigo',
            'nombre',  # ordena alfabéticamente por nombre
        ]

    def __str__(self):
        return f"{self.categoria.catalogo.nombre} / {self.categoria.codigo} - {self.nombre}"

    def total_videos(self):
        return self.videos.filter(activo=True).count()


def video_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    catalogo_nombre = instance.capitulo.categoria.catalogo.nombre.replace(' ', '_')
    categoria_codigo = instance.capitulo.categoria.codigo
    video_titulo = instance.titulo.replace(' ', '_')[:50]
    # numero_orden eliminado del nombre del archivo
    newname = f"{catalogo_nombre}_{categoria_codigo}_{video_titulo}.{ext}"
    return f"videos/{catalogo_nombre}/{categoria_codigo}/{newname}"


class Video(models.Model):
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('REVISION', 'En revisión'),
        ('PUBLICADO', 'Publicado'),
        ('ARCHIVADO', 'Archivado'),
    ]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='BORRADOR')
    # numero_orden eliminado

    archivo_video = models.FileField(
        upload_to=video_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['mp4', 'avi', 'mov', 'mkv', 'webm'])],
        help_text="Formatos permitidos: MP4, AVI, MOV, MKV, WEBM"
    )

    duracion = models.DurationField(blank=True, null=True, help_text="Duración del video en formato HH:MM:SS")
    tamaño_archivo = models.BigIntegerField(blank=True, null=True, help_text="Tamaño del archivo en bytes")
    resolucion = models.CharField(max_length=20, blank=True, null=True, help_text="Ej: 1920x1080")

    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True, null=True)

    visualizaciones = models.PositiveIntegerField(default=0)
    fecha_publicacion = models.DateTimeField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    capitulo = models.ForeignKey(Capitulo, on_delete=models.CASCADE, related_name='videos')

    autor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='videos_subidos_por'
    )

    administrador = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        limit_choices_to={'rol': 'ADMIN'},
        related_name='videos_aprobados_por'
    )

    class Meta:
        verbose_name = "Video"
        verbose_name_plural = "Videos"
        # unique_together eliminado (dependía de numero_orden)
        ordering = [
            'capitulo__categoria__catalogo__nombre',
            'capitulo__categoria__codigo',
            'capitulo__nombre',
            'titulo',  # ordena por título dentro del capítulo
        ]

    def __str__(self):
        return f"{self.capitulo} - {self.titulo}"

    def get_file_size_display(self):
        if not self.tamaño_archivo:
            return "Desconocido"
        size = self.tamaño_archivo
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    def get_duration_display(self):
        if not self.duracion:
            return "00:00"
        total_seconds = int(self.duracion.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{minutes:02d}:{seconds:02d}"

    def incrementar_visualizaciones(self):
        self.visualizaciones += 1
        self.save(update_fields=['visualizaciones'])

    def get_ruta_categoria(self):
        # Catálogo > Categoría > Capítulo
        return f"{self.capitulo.categoria.catalogo.nombre} > {self.capitulo.categoria.nombre} > {self.capitulo.nombre}"

    def total_likes(self):
        return self.likes.count()

    def total_comentarios(self):
        return self.comentarios.filter(activo=True).count()

    def total_guardados(self):
        return self.guardados.count()

    def total_compartidas(self):
        return self.compartidas.count()

    def usuario_ha_dado_like(self, usuario):
        if not usuario.is_authenticated:
            return False
        return self.likes.filter(usuario=usuario).exists()

    def usuario_ha_guardado(self, usuario):
        if not usuario.is_authenticated:
            return False
        return self.guardados.filter(usuario=usuario).exists()

    def usuario_ha_compartido(self, usuario):
        if not usuario.is_authenticated:
            return False
        return self.compartidas.filter(usuario=usuario).exists()


class VisualizacionVideo(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='visualizaciones_usuario')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos_vistos')
    fecha_visualizacion = models.DateTimeField(auto_now_add=True)
    progreso = models.FloatField(default=0.0, help_text="Progreso de visualización en porcentaje (0-100)")
    completado = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Visualización de Video"
        verbose_name_plural = "Visualizaciones de Videos"
        unique_together = ['video', 'usuario']
        ordering = ['-fecha_visualizacion']

    def __str__(self):
        return f"{self.usuario.username} - {self.video.titulo} ({self.progreso}%)"


class ComentarioVideo(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comentarios_videos')
    texto = models.TextField(max_length=1000, help_text="Contenido del comentario")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    comentario_padre = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='respuestas'
    )

    class Meta:
        verbose_name = "Comentario de Video"
        verbose_name_plural = "Comentarios de Videos"
        ordering = ['-fecha_creacion']

    def __str__(self):
        if self.comentario_padre:
            return f"Respuesta de {self.usuario.username} a {self.video.titulo}"
        return f"Comentario de {self.usuario.username} en {self.video.titulo}"

    def total_likes(self):
        return self.likes_comentario.count()

    def es_respuesta(self):
        return self.comentario_padre is not None


class LikeVideo(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='likes')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos_liked')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Like de Video"
        verbose_name_plural = "Likes de Videos"
        unique_together = ['video', 'usuario']
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.usuario.username} - {self.video.titulo}"


class LikeComentario(models.Model):
    comentario = models.ForeignKey(ComentarioVideo, on_delete=models.CASCADE, related_name='likes_comentario')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comentarios_liked')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Like de Comentario"
        verbose_name_plural = "Likes de Comentarios"
        unique_together = ['comentario', 'usuario']
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.usuario.username} - Comentario: {self.comentario.texto[:50]}"


class VideoGuardado(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='guardados')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos_guardados')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Video Guardado"
        verbose_name_plural = "Videos Guardados"
        unique_together = ['video', 'usuario']
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.usuario.username} - {self.video.titulo}"


class CompartirVideo(models.Model):
    TIPO_COMPARTIR_CHOICES = [
        ('LINK', 'Enlace copiado'),
        ('SOCIAL', 'Red social'),
        ('EMAIL', 'Correo electrónico'),
        ('WHATSAPP', 'WhatsApp'),
        ('OTROS', 'Otros'),
    ]

    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='compartidas')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos_compartidos', null=True, blank=True)
    tipo = models.CharField(max_length=10, choices=TIPO_COMPARTIR_CHOICES, default='LINK')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = "Video Compartido"
        verbose_name_plural = "Videos Compartidos"
        ordering = ['-fecha_creacion']

    def __str__(self):
        usuario_str = self.usuario.username if self.usuario else "Usuario anónimo"
        return f"{usuario_str} - {self.video.titulo} ({self.tipo})"
