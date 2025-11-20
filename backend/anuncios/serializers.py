from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Anuncio

User = get_user_model()


class AdministradorSerializer(serializers.ModelSerializer):
    """
    Mini serializer para mostrar info básica del admin.
    Asume que tu User tiene first_name/last_name/username.
    """
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'nombre_completo']

    def get_nombre_completo(self, obj):
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre or obj.username


class AnuncioListSerializer(serializers.ModelSerializer):
    """Listado/detalle para admin (lectura)."""
    administrador = AdministradorSerializer(read_only=True)
    vigente = serializers.SerializerMethodField()
    url_imagen = serializers.SerializerMethodField()

    class Meta:
        model = Anuncio
        fields = [
            'id', 'titulo', 'descripcion', 'url_destino',
            'fecha_inicio', 'fecha_fin', 'activo',
            'fecha_creacion', 'fecha_actualizacion',
            'vigente', 'url_imagen', 'administrador',
        ]

    def get_vigente(self, obj):
        return obj.es_vigente()

    def get_url_imagen(self, obj):
        if obj.imagen:
            req = self.context.get('request')
            if req:
                return req.build_absolute_uri(obj.imagen.url)
        return None


class AnuncioCreateSerializer(serializers.ModelSerializer):
    """Crear/actualizar para admin (escritura)."""
    class Meta:
        model = Anuncio
        fields = [
            'titulo', 'descripcion', 'imagen', 'url_destino',
            'fecha_inicio', 'fecha_fin', 'activo'
        ]

    def validate(self, attrs):
        fi = attrs.get('fecha_inicio')
        ff = attrs.get('fecha_fin')
        if fi and ff and ff < fi:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha de fin debe ser mayor o igual a la fecha de inicio.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data['administrador'] = self.context['request'].user
        return super().create(validated_data)


class AnuncioPublicoSerializer(serializers.ModelSerializer):
    """Serializer para la API pública (solo lectura)."""
    vigente = serializers.SerializerMethodField()
    url_imagen = serializers.SerializerMethodField()

    class Meta:
        model = Anuncio
        fields = [
            'id', 'titulo', 'descripcion', 'url_destino',
            'fecha_inicio', 'fecha_fin',
            'vigente', 'url_imagen'
        ]

    def get_vigente(self, obj):
        return obj.es_vigente()

    def get_url_imagen(self, obj):
        if obj.imagen:
            req = self.context.get('request')
            if req:
                return req.build_absolute_uri(obj.imagen.url)
        return None
