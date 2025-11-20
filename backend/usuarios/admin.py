# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Datos adicionales", {"fields": ("rol",)}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        (None, {"fields": ("rol", "email")}),
    )
    list_display = ("username", "email", "first_name", "last_name", "rol", "is_active", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name")
