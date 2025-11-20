from rest_framework import serializers
from django.db import models
from django.contrib.auth import get_user_model
from .models import (
    Categoria, Catalogo, Capitulo, Video, VisualizacionVideo,
    ComentarioVideo, LikeVideo, LikeComentario, VideoGuardado, CompartirVideo
)

User = get_user_model()


class AdministradorSerializer(serializers.ModelSerializer):
    """Serializer para mostrar información básica del administrador"""
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'nombre_completo']

    def get_nombre_completo(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


# =========================
#        VIDEOS
# =========================

class VideoListSerializer(serializers.ModelSerializer):
    """Serializer para listar videos (vista resumida)"""
    administrador = AdministradorSerializer(read_only=True)
    duracion_display = serializers.CharField(source='get_duration_display', read_only=True)
    tamaño_display = serializers.CharField(source='get_file_size_display', read_only=True)
    ruta_categoria = serializers.CharField(source='get_ruta_categoria', read_only=True)
    url_video = serializers.SerializerMethodField()
    url_thumbnail = serializers.SerializerMethodField()

    # info básica del autor (quien sube)
    autor_info = serializers.SerializerMethodField()

    # Campos para interacciones sociales (vienen anotados en queryset)
    total_likes = serializers.IntegerField(read_only=True)
    total_comentarios = serializers.IntegerField(read_only=True)
    total_guardados = serializers.IntegerField(read_only=True)
    total_compartidas = serializers.IntegerField(read_only=True)
    usuario_ha_dado_like = serializers.SerializerMethodField()
    usuario_ha_guardado = serializers.SerializerMethodField()
    usuario_ha_compartido = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            'id', 'titulo', 'descripcion', 'estado',
            'duracion_display', 'tamaño_display', 'resolucion', 'visualizaciones',
            'fecha_publicacion', 'fecha_creacion', 'activo', 'administrador',
            'ruta_categoria', 'url_video', 'url_thumbnail',
            'autor_info',
            'total_likes', 'total_comentarios', 'total_guardados', 'total_compartidas',
            'usuario_ha_dado_like', 'usuario_ha_guardado', 'usuario_ha_compartido'
        ]

    def get_autor_info(self, obj):
        if not getattr(obj, 'autor', None):
            return None
        nombre = f"{obj.autor.first_name} {obj.autor.last_name}".strip()
        return {
            'id': obj.autor.id,
            'username': obj.autor.username,
            'first_name': obj.autor.first_name,
            'last_name': obj.autor.last_name,
            'nombre_completo': nombre or obj.autor.username,
        }

    def get_url_video(self, obj):
        if obj.archivo_video:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo_video.url)
        return None

    def get_url_thumbnail(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
        return None

    def get_usuario_ha_dado_like(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.usuario_ha_dado_like(request.user)
        return False

    def get_usuario_ha_guardado(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.usuario_ha_guardado(request.user)
        return False

    def get_usuario_ha_compartido(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.usuario_ha_compartido(request.user)
        return False


class VideoDetailSerializer(VideoListSerializer):
    """Serializer para detalle completo del video"""
    capitulo_info = serializers.SerializerMethodField()

    class Meta(VideoListSerializer.Meta):
        fields = VideoListSerializer.Meta.fields + ['capitulo_info']

    def get_capitulo_info(self, obj):
        # Jerarquía: Video -> Capitulo -> Categoria -> Catalogo
        return {
            'id': obj.capitulo.id,
            'nombre': obj.capitulo.nombre,
            'categoria': {
                'id': obj.capitulo.categoria.id,
                'codigo': obj.capitulo.categoria.codigo,
                'nombre': obj.capitulo.categoria.nombre,
                'catalogo': {
                    'id': obj.capitulo.categoria.catalogo.id,
                    'nombre': obj.capitulo.categoria.catalogo.nombre,
                }
            }
        }


class VideoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = [
            'titulo', 'descripcion', 'estado',
            'archivo_video', 'duracion', 'resolucion', 'thumbnail',
            'capitulo'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['autor'] = user

        if getattr(user, 'rol', '').upper() != 'ADMIN':
            validated_data['estado'] = 'REVISION'
            validated_data.pop('administrador', None)
        else:
            if not validated_data.get('estado'):
                validated_data['estado'] = 'PUBLICADO'
            validated_data['administrador'] = user

        return super().create(validated_data)


# =========================
#       CAPÍTULOS
# =========================

class CapituloListSerializer(serializers.ModelSerializer):
    """Serializer para listar capítulos"""
    total_videos = serializers.IntegerField(read_only=True)
    administrador = AdministradorSerializer(read_only=True)
    categoria_info = serializers.SerializerMethodField()

    class Meta:
        model = Capitulo
        fields = [
            'id', 'nombre', 'descripcion', 'fecha_creacion',
            'fecha_actualizacion', 'activo', 'total_videos', 'administrador', 'categoria_info',
        ]

    def get_categoria_info(self, obj):
        """Retornar info resumida de la categoría (y su catálogo)"""
        if not getattr(obj, 'categoria', None):
            return None
        cat = obj.categoria
        catalogo = getattr(cat, 'catalogo', None)
        return {
            'id': cat.id,
            'codigo': getattr(cat, 'codigo', None),
            'nombre': getattr(cat, 'nombre', None),
            'catalogo': {
                'id': getattr(catalogo, 'id', None),
                'nombre': getattr(catalogo, 'nombre', None),
            } if catalogo else None
        }

class CapituloDetailSerializer(CapituloListSerializer):
    """Serializer para detalle del capítulo con sus videos"""
    videos = VideoListSerializer(many=True, read_only=True)

    class Meta(CapituloListSerializer.Meta):
        fields = CapituloListSerializer.Meta.fields + ['videos']


class CapituloCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar capítulos (FK a categoria)"""

    class Meta:
        model = Capitulo
        fields = ['nombre', 'descripcion', 'categoria', 'activo']

    def create(self, validated_data):
        validated_data['administrador'] = self.context['request'].user
        return super().create(validated_data)


# =========================
#       CATÁLOGOS
# =========================

class CatalogoListSerializer(serializers.ModelSerializer):
    """Serializer para listar catálogos"""
    total_categorias = serializers.IntegerField(read_only=True)
    total_capitulos = serializers.IntegerField(read_only=True)
    total_videos = serializers.IntegerField(read_only=True)
    administrador = AdministradorSerializer(read_only=True)

    class Meta:
        model = Catalogo
        fields = [
            'id', 'nombre', 'descripcion', 'fecha_creacion', 'fecha_actualizacion',
            'activo', 'total_categorias', 'total_capitulos', 'total_videos', 'administrador'
        ]


class CatalogoDetailSerializer(CatalogoListSerializer):
    """Detalle del catálogo con sus categorías (y cada categoría tendrá sus capítulos vía endpoint)"""
    class Meta(CatalogoListSerializer.Meta):
        fields = CatalogoListSerializer.Meta.fields


class CatalogoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar catálogos (SIN FK a categoría)"""

    class Meta:
        model = Catalogo
        fields = ['nombre', 'descripcion', 'activo']

    def validate(self, attrs):
        nombre = attrs.get('nombre')
        instance = self.instance
        if nombre:
            qs = Catalogo.objects.filter(nombre=nombre)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                raise serializers.ValidationError({'nombre': f"Ya existe un catálogo con el nombre '{nombre}'."})
        return attrs

    def create(self, validated_data):
        validated_data['administrador'] = self.context['request'].user
        return super().create(validated_data)


# =========================
#       CATEGORÍAS
# =========================

class CategoriaListSerializer(serializers.ModelSerializer):
    """Serializer para listar categorías (FK a Catálogo)"""
    total_capitulos = serializers.IntegerField(read_only=True)
    total_videos = serializers.IntegerField(read_only=True)
    administrador = AdministradorSerializer(read_only=True)
    catalogo_info = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'fecha_creacion',
            'fecha_actualizacion', 'activo', 'total_capitulos', 'total_videos',
            'administrador', 'catalogo_info'
        ]

    def get_catalogo_info(self, obj):
        if not obj.catalogo_id:
            return None
        return {
            'id': obj.catalogo.id,
            'nombre': obj.catalogo.nombre,
        }


class CategoriaDetailSerializer(CategoriaListSerializer):
    """Detalle de la categoría con sus capítulos"""
    capitulos = CapituloListSerializer(many=True, read_only=True)

    class Meta(CategoriaListSerializer.Meta):
        fields = CategoriaListSerializer.Meta.fields + ['capitulos']


class CategoriaCreateSerializer(serializers.ModelSerializer):
    """Crear/actualizar categorías (requiere catálogo)"""

    class Meta:
        model = Categoria
        fields = ['codigo', 'nombre', 'descripcion', 'activo', 'catalogo']

    def validate_codigo(self, value):
        instance = self.instance
        queryset = Categoria.objects.filter(codigo=value)
        if instance:
            queryset = queryset.exclude(id=instance.id)
        if queryset.exists():
            raise serializers.ValidationError(f"Ya existe una categoría con el código '{value}'.")
        return value

    def create(self, validated_data):
        validated_data['administrador'] = self.context['request'].user
        return super().create(validated_data)


# =========================
#  VISUALIZACIONES / PÚBLICO
# =========================

class VisualizacionVideoSerializer(serializers.ModelSerializer):
    """Serializer para tracking de visualizaciones"""
    video_info = serializers.SerializerMethodField()
    usuario_info = serializers.SerializerMethodField()

    class Meta:
        model = VisualizacionVideo
        fields = [
            'id', 'fecha_visualizacion', 'progreso', 'completado',
            'video_info', 'usuario_info'
        ]

    def get_video_info(self, obj):
        return {
            'id': obj.video.id,
            'titulo': obj.video.titulo,
            'duracion_display': obj.video.get_duration_display()
        }

    def get_usuario_info(self, obj):
        return {
            'id': obj.usuario.id,
            'username': obj.usuario.username,
            'nombre_completo': f"{obj.usuario.first_name} {obj.usuario.last_name}".strip() or obj.usuario.username
        }


class VideoPublicoSerializer(serializers.ModelSerializer):
    """Serializer para videos públicos (solo publicados)"""
    duracion_display = serializers.CharField(source='get_duration_display', read_only=True)
    url_video = serializers.SerializerMethodField()
    url_thumbnail = serializers.SerializerMethodField()
    categoria_nombre = serializers.CharField(source='capitulo.categoria.nombre', read_only=True)
    catalogo_nombre = serializers.CharField(source='capitulo.categoria.catalogo.nombre', read_only=True)
    capitulo_nombre = serializers.CharField(source='capitulo.nombre', read_only=True)

    # Interacciones sociales (anotadas)
    total_likes = serializers.IntegerField(read_only=True)
    total_comentarios = serializers.IntegerField(read_only=True)
    total_guardados = serializers.IntegerField(read_only=True)
    total_compartidas = serializers.IntegerField(read_only=True)
    usuario_ha_dado_like = serializers.SerializerMethodField()
    usuario_ha_guardado = serializers.SerializerMethodField()
    usuario_ha_compartido = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            'id', 'titulo', 'descripcion', 'duracion_display', 'visualizaciones',
            'fecha_publicacion', 'url_video', 'url_thumbnail', 'categoria_nombre',
            'catalogo_nombre', 'capitulo_nombre', 'total_likes', 'total_comentarios',
            'total_guardados', 'total_compartidas', 'usuario_ha_dado_like', 'usuario_ha_guardado',
            'usuario_ha_compartido'
        ]

    def get_url_video(self, obj):
        if obj.archivo_video:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo_video.url)
        return None

    def get_url_thumbnail(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
        return None

    def get_usuario_ha_dado_like(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.usuario_ha_dado_like(request.user)
        return False

    def get_usuario_ha_guardado(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.usuario_ha_guardado(request.user)
        return False

    def get_usuario_ha_compartido(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.usuario_ha_compartido(request.user)
        return False


# =========================
#  COMENTARIOS / LIKES / GUARDADOS / COMPARTIR
# =========================

class ComentarioVideoSerializer(serializers.ModelSerializer):
    """Serializer para comentarios de videos"""
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    total_likes = serializers.IntegerField(read_only=True)
    usuario_ha_dado_like = serializers.SerializerMethodField()
    respuestas = serializers.SerializerMethodField()

    class Meta:
        model = ComentarioVideo
        fields = [
            'id', 'texto', 'fecha_creacion', 'fecha_actualizacion', 'activo',
            'comentario_padre', 'usuario_nombre', 'usuario_username', 'total_likes',
            'usuario_ha_dado_like', 'respuestas'
        ]
        read_only_fields = ['usuario', 'fecha_creacion', 'fecha_actualizacion']

    def get_usuario_ha_dado_like(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes_comentario.filter(usuario=request.user).exists()
        return False

    def get_respuestas(self, obj):
        if obj.comentario_padre is None:  # Solo para comentarios principales
            respuestas = obj.respuestas.filter(activo=True).annotate(
                total_likes=models.Count('likes_comentario')
            ).order_by('fecha_creacion')
            return ComentarioVideoSerializer(respuestas, many=True, context=self.context).data
        return []

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class ComentarioCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear comentarios"""

    class Meta:
        model = ComentarioVideo
        fields = ['texto', 'video', 'comentario_padre']

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class LikeVideoSerializer(serializers.ModelSerializer):
    """Serializer para likes de videos"""
    class Meta:
        model = LikeVideo
        fields = ['id', 'fecha_creacion']
        read_only_fields = ['usuario', 'fecha_creacion']


class LikeComentarioSerializer(serializers.ModelSerializer):
    """Serializer para likes de comentarios"""
    class Meta:
        model = LikeComentario
        fields = ['id', 'fecha_creacion']
        read_only_fields = ['usuario', 'fecha_creacion']


class VideoGuardadoSerializer(serializers.ModelSerializer):
    """Serializer para videos guardados"""
    video_info = serializers.SerializerMethodField()

    class Meta:
        model = VideoGuardado
        fields = ['id', 'fecha_creacion', 'video_info']
        read_only_fields = ['usuario', 'fecha_creacion']

    def get_video_info(self, obj):
        return VideoPublicoSerializer(obj.video, context=self.context).data


class CompartirVideoSerializer(serializers.ModelSerializer):
    """Serializer para tracking de videos compartidos"""
    class Meta:
        model = CompartirVideo
        fields = ['id', 'tipo', 'fecha_creacion']
        read_only_fields = ['usuario', 'fecha_creacion', 'ip_address']
