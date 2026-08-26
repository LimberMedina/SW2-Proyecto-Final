# users/serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import PreferenciasUsuario

from .models import User, PreferenciasUsuario


class RegistroUsuarioSerializer(serializers.ModelSerializer):
    # Exponemos nombre/apellidos en español mapeando a first_name/last_name
    nombre = serializers.CharField(write_only=True)
    apellidos = serializers.CharField(write_only=True)
    contraseña = serializers.CharField(write_only=True, min_length=8)
   

    class Meta:
        model = User
        fields = (
            
            "username",
            "nombre",
            "apellidos",
            "email",
            "contraseña",
            "rol",
        )

    def validate_contraseña(self, value):
        validate_password(value)
        return value

    def validate_rol(self, value):
        value = value.upper()
        if value not in ["ADMIN", "USER"]:
            raise serializers.ValidationError("El rol debe ser ADMIN o USER.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("contraseña")
        nombre = validated_data.pop("nombre")
        apellidos = validated_data.pop("apellidos")

        user = User(**validated_data)
        user.first_name = nombre
        user.last_name = apellidos
        user.set_password(password)      # Hash seguro
        user.save()
        return user


class UsuarioMeSerializer(serializers.ModelSerializer):
    # nombre/apellidos de solo lectura (desde first_name/last_name)
    nombre = serializers.CharField(source="first_name", read_only=True)
    apellidos = serializers.CharField(source="last_name", read_only=True)

    class Meta:
        model = User
        fields = ("id","username","nombre","apellidos","email","rol")


class UsuarioAdminSerializer(serializers.ModelSerializer):
    """Serializer para administración de usuarios (CRUD completo)"""
    nombre = serializers.CharField(source="first_name", required=False, allow_blank=True)
    apellidos = serializers.CharField(source="last_name", required=False, allow_blank=True)
    contraseña = serializers.CharField(write_only=True, required=False, min_length=8)
    fecha_registro = serializers.DateTimeField(source="date_joined", read_only=True)
    ultimo_acceso = serializers.DateTimeField(source="last_login", read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "nombre", "apellidos", "email", "rol",
            "is_active", "fecha_registro", "ultimo_acceso", "contraseña"
        )
        read_only_fields = ("id", "fecha_registro", "ultimo_acceso")

    def validate_rol(self, value):
        if value:
            value = value.upper()
            if value not in ["ADMIN", "USER"]:
                raise serializers.ValidationError("El rol debe ser ADMIN o USER.")
        return value

    def validate_contraseña(self, value):
        if value:
            validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("contraseña", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("contraseña", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class PreferenciasUsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para las preferencias del usuario.
    """
    
    class Meta:
        model = PreferenciasUsuario
        fields = [
            'id',
            'notif_email',
            'notif_push',
            'notif_nuevos_videos',
            'notif_comentarios',
            'perfil_visible',
            'mostrar_email',
            'mostrar_actividad',
            'autoplay',
            'calidad_video',
            'subtitulos_auto',
            'tema',
            'idioma',
            'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_actualizacion']
        read_only_fields = ['fecha_actualizacion']
