from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Categoria, Catalogo, Capitulo, Video, VisualizacionVideo


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = [
        'catalogo_link', 'codigo', 'nombre', 'activo',
        'administrador', 'fecha_creacion', 'total_capitulos_display', 'total_videos_display'
    ]
    list_filter = ['activo', 'administrador', 'fecha_creacion', 'catalogo']
    search_fields = ['codigo', 'nombre', 'descripcion', 'catalogo__nombre']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    autocomplete_fields = ['catalogo', 'administrador']
    list_select_related = ['catalogo', 'administrador']
    ordering = ['catalogo__nombre', 'codigo', 'nombre']

    fieldsets = (
        ('Información Básica', {
            'fields': ('catalogo', 'codigo', 'nombre', 'descripcion')
        }),
        ('Estado', {
            'fields': ('activo', 'administrador')
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

    def catalogo_link(self, obj):
        if obj.catalogo_id:
            url = reverse('admin:catalogodigital_catalogo_change', args=[obj.catalogo_id])
            return format_html('<a href="{}">{}</a>', url, obj.catalogo.nombre)
        return '-'
    catalogo_link.short_description = 'Catálogo'
    catalogo_link.admin_order_field = 'catalogo__nombre'

    def total_capitulos_display(self, obj):
        return obj.capitulos.filter(activo=True).count()
    total_capitulos_display.short_description = 'Total Capítulos'

    def total_videos_display(self, obj):
        return obj.total_videos()
    total_videos_display.short_description = 'Total Videos'


@admin.register(Catalogo)
class CatalogoAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'activo', 'administrador', 'fecha_creacion',
        'total_categorias_display', 'total_capitulos_display', 'total_videos_display'
    ]
    list_filter = ['activo', 'administrador', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    autocomplete_fields = ['administrador']
    list_select_related = ['administrador']
    ordering = ['nombre']

    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion')
        }),
        ('Estado', {
            'fields': ('activo', 'administrador')
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

    def total_categorias_display(self, obj):
        return obj.categorias.filter(activo=True).count()
    total_categorias_display.short_description = 'Total Categorías'

    def total_capitulos_display(self, obj):
        return obj.total_capitulos()
    total_capitulos_display.short_description = 'Total Capítulos'

    def total_videos_display(self, obj):
        return obj.total_videos()
    total_videos_display.short_description = 'Total Videos'


@admin.register(Capitulo)
class CapituloAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'categoria_link', 'catalogo_link',
        'activo', 'administrador', 'fecha_creacion',
        'total_videos_display'
    ]
    list_filter = ['activo', 'categoria__catalogo', 'categoria', 'administrador', 'fecha_creacion']
    search_fields = [
        'nombre', 'descripcion',
        'categoria__nombre', 'categoria__catalogo__nombre'
    ]
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    autocomplete_fields = ['categoria', 'administrador']
    list_select_related = ['categoria', 'categoria__catalogo', 'administrador']
    ordering = ['categoria__catalogo__nombre', 'categoria__codigo', 'nombre']

    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'categoria')
        }),
        ('Estado', {
            'fields': ('activo', 'administrador')
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

    def categoria_link(self, obj):
        if obj.categoria_id:
            url = reverse('admin:catalogodigital_categoria_change', args=[obj.categoria_id])
            return format_html('<a href="{}">{}</a>', url, obj.categoria.nombre)
        return '-'
    categoria_link.short_description = 'Categoría'
    categoria_link.admin_order_field = 'categoria__nombre'

    def catalogo_link(self, obj):
        catalogo = getattr(obj.categoria, 'catalogo', None)
        if catalogo:
            url = reverse('admin:catalogodigital_catalogo_change', args=[catalogo.id])
            return format_html('<a href="{}">{}</a>', url, catalogo.nombre)
        return '-'
    catalogo_link.short_description = 'Catálogo'
    catalogo_link.admin_order_field = 'categoria__catalogo__nombre'

    def total_videos_display(self, obj):
        return obj.videos.filter(activo=True).count()
    total_videos_display.short_description = 'Total Videos'


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'capitulo_link', 'categoria_link', 'catalogo_link',
        'estado', 'activo', 'administrador',
        'fecha_publicacion', 'visualizaciones'
    ]
    list_filter = [
        'estado', 'activo',
        'capitulo__categoria__catalogo', 'capitulo__categoria',
        'administrador', 'fecha_publicacion'
    ]
    search_fields = [
        'titulo', 'descripcion',
        'capitulo__nombre',
        'capitulo__categoria__nombre',
        'capitulo__categoria__catalogo__nombre'
    ]
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion', 'visualizaciones', 'archivo_info']
    autocomplete_fields = ['capitulo', 'administrador', 'autor']
    list_select_related = ['capitulo', 'capitulo__categoria', 'capitulo__categoria__catalogo', 'administrador', 'autor']
    ordering = [
        'capitulo__categoria__catalogo__nombre',
        'capitulo__categoria__codigo',
        'capitulo__nombre',
        'titulo'
    ]

    fieldsets = (
        ('Información Básica', {
            'fields': ('titulo', 'descripcion', 'capitulo')
        }),
        ('Archivo de Video', {
            'fields': ('archivo_video', 'archivo_info', 'thumbnail')
        }),
        ('Publicación', {
            'fields': ('estado', 'fecha_publicacion', 'activo')
        }),
        ('Administración', {
            'fields': ('administrador', 'autor', 'visualizaciones')
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

    def capitulo_link(self, obj):
        if obj.capitulo_id:
            url = reverse('admin:catalogodigital_capitulo_change', args=[obj.capitulo_id])
            return format_html('<a href="{}">{}</a>', url, obj.capitulo.nombre)
        return '-'
    capitulo_link.short_description = 'Capítulo'
    capitulo_link.admin_order_field = 'capitulo__nombre'

    def categoria_link(self, obj):
        categoria = getattr(obj.capitulo, 'categoria', None)
        if categoria:
            url = reverse('admin:catalogodigital_categoria_change', args=[categoria.id])
            return format_html('<a href="{}">{}</a>', url, categoria.nombre)
        return '-'
    categoria_link.short_description = 'Categoría'
    categoria_link.admin_order_field = 'capitulo__categoria__nombre'

    def catalogo_link(self, obj):
        catalogo = getattr(obj.capitulo.categoria, 'catalogo', None) if obj.capitulo_id else None
        if catalogo:
            url = reverse('admin:catalogodigital_catalogo_change', args=[catalogo.id])
            return format_html('<a href="{}">{}</a>', url, catalogo.nombre)
        return '-'
    catalogo_link.short_description = 'Catálogo'
    catalogo_link.admin_order_field = 'capitulo__categoria__catalogo__nombre'

    def archivo_info(self, obj):
        if obj.archivo_video:
            try:
                size = obj.archivo_video.size
                size_mb = size / (1024 * 1024)
                return format_html(
                    '<strong>Archivo:</strong> {}<br><strong>Tamaño:</strong> {:.2f} MB',
                    obj.archivo_video.name.split('/')[-1],
                    size_mb
                )
            except Exception:
                return obj.archivo_video.name
        return 'No hay archivo'
    archivo_info.short_description = 'Información del Archivo'

    def save_model(self, request, obj, form, change):
        if not change and not obj.administrador_id and getattr(request.user, 'rol', '').upper() == 'ADMIN':
            obj.administrador = request.user
        super().save_model(request, obj, form, change)


@admin.register(VisualizacionVideo)
class VisualizacionVideoAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'video_link', 'progreso', 'completado', 'fecha_visualizacion']
    list_filter = ['completado', 'fecha_visualizacion', 'video__capitulo__categoria__catalogo']
    search_fields = ['usuario__username', 'usuario__email', 'video__titulo']
    readonly_fields = ['fecha_visualizacion']
    autocomplete_fields = ['usuario', 'video']
    list_select_related = ['usuario', 'video', 'video__capitulo', 'video__capitulo__categoria', 'video__capitulo__categoria__catalogo']
    ordering = ['-fecha_visualizacion']

    def video_link(self, obj):
        if obj.video_id:
            url = reverse('admin:catalogodigital_video_change', args=[obj.video_id])
            return format_html('<a href="{}">{}</a>', url, obj.video.titulo)
        return '-'
    video_link.short_description = 'Video'
    video_link.admin_order_field = 'video__titulo'

    def has_add_permission(self, request):
        return False


# NOTA: Esto no es estrictamente necesario; puedes eliminarlo si no lo usas.
Categoria.search_fields = ['codigo', 'nombre', 'catalogo__nombre']
Catalogo.search_fields = ['nombre']
Capitulo.search_fields = ['nombre', 'categoria__nombre', 'categoria__catalogo__nombre']
Video.search_fields = ['titulo', 'capitulo__nombre', 'capitulo__categoria__nombre', 'capitulo__categoria__catalogo__nombre']
