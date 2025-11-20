from django.contrib import admin
from .models import Anuncio


@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = (
        'titulo', 'activo', 'fecha_inicio', 'fecha_fin',
        'administrador', 'es_vigente', 'fecha_creacion'
    )
    list_filter = ('activo', 'fecha_inicio', 'fecha_fin', 'administrador')
    search_fields = ('titulo', 'descripcion')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    autocomplete_fields = ('administrador',)
    ordering = ('-fecha_inicio', '-fecha_creacion')
