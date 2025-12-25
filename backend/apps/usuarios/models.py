from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'admin')
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractUser):
    """
    Usuario personalizado con roles según documento de requerimientos:
    - Admin: Acceso total a todos los módulos
    - Revalidaciones (Ejecutivo): Crear tickets, editar ETA y días libres (max 2 ediciones)
    - Pagos: Ver listado de tickets (solo lectura) y registrar pagos
    """
    
    class Rol(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        EJECUTIVO = 'ejecutivo', 'Revalidaciones'
        PAGOS = 'pagos', 'Pagos'
    
    username = None  # Removemos username, usaremos email
    email = models.EmailField('Correo electrónico', unique=True)
    nombre = models.CharField('Nombre completo', max_length=150)
    rol = models.CharField(
        'Rol',
        max_length=20,
        choices=Rol.choices,
        default=Rol.EJECUTIVO
    )
    activo = models.BooleanField('Activo', default=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    ultimo_acceso = models.DateTimeField('Último acceso', null=True, blank=True)
    
    objects = UsuarioManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']
    
    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.get_rol_display()})"
    
    @property
    def es_admin(self):
        return self.rol == self.Rol.ADMIN
    
    @property
    def es_ejecutivo(self):
        return self.rol == self.Rol.EJECUTIVO
    
    @property
    def es_pagos(self):
        return self.rol == self.Rol.PAGOS
    
    @property
    def puede_crear_tickets(self):
        return self.rol in [self.Rol.ADMIN, self.Rol.EJECUTIVO]
    
    @property
    def puede_registrar_pagos(self):
        return self.rol in [self.Rol.ADMIN, self.Rol.PAGOS]
