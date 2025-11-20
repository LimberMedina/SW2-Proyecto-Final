# users/serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()

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
