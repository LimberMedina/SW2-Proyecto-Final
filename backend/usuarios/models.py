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
