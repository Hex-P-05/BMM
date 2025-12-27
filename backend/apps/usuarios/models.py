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
    Usuario personalizado con roles según documento de requerimientos actualizado:

    ROLES (4 roles + 1 admin):
    - Admin: Acceso total a todos los módulos
    - Revalidaciones: Trabaja con navieras, usa BL como ID, paga demoras
    - Logística: Trabaja con terminales, usa # contenedor como ID, paga almacenajes
    - Pagos: Registra pagos, puede pagar almacenajes (junto con logística)
    - Clasificación: Da de alta datos iniciales, requiere visto bueno del dirigente

    Cada rol tiene su propia sábana operativa y no pueden ver la del otro.
    El ejecutivo se asigna dependiendo de los tres departamentos.
    """

    class Rol(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        REVALIDACIONES = 'revalidaciones', 'Revalidaciones'
        LOGISTICA = 'logistica', 'Logística'
        PAGOS = 'pagos', 'Pagos'
        CLASIFICACION = 'clasificacion', 'Clasificación'

    class Departamento(models.TextChoices):
        REVALIDACIONES = 'revalidaciones', 'Revalidaciones'
        LOGISTICA = 'logistica', 'Logística'
        CLASIFICACION = 'clasificacion', 'Clasificación'

    username = None  # Removemos username, usaremos email
    email = models.EmailField('Correo electrónico', unique=True)
    nombre = models.CharField('Nombre completo', max_length=150)
    rol = models.CharField(
        'Rol',
        max_length=20,
        choices=Rol.choices,
        default=Rol.LOGISTICA
    )
    departamento = models.CharField(
        'Departamento',
        max_length=20,
        choices=Departamento.choices,
        null=True,
        blank=True,
        help_text='Departamento al que pertenece el usuario'
    )
    puerto_asignado = models.ForeignKey(
        'catalogos.Puerto',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        verbose_name='Puerto asignado',
        help_text='Cada puerto tiene su propia logística y revalidaciones'
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

    # ========== Propiedades de Rol ==========
    @property
    def es_admin(self):
        return self.rol == self.Rol.ADMIN

    @property
    def es_revalidaciones(self):
        return self.rol == self.Rol.REVALIDACIONES

    @property
    def es_logistica(self):
        return self.rol == self.Rol.LOGISTICA

    @property
    def es_pagos(self):
        return self.rol == self.Rol.PAGOS

    @property
    def es_clasificacion(self):
        return self.rol == self.Rol.CLASIFICACION

    # ========== Propiedades de Permisos ==========

    # --- Contenedores ---
    @property
    def puede_crear_contenedores(self):
        """Clasificación da de alta contenedores"""
        return self.rol in [self.Rol.ADMIN, self.Rol.CLASIFICACION]

    @property
    def puede_ver_contenedores(self):
        """Todos pueden ver contenedores"""
        return True

    # --- Operaciones Logística ---
    @property
    def puede_crear_operaciones_logistica(self):
        """Logística y Admin pueden crear operaciones de logística"""
        return self.rol in [self.Rol.ADMIN, self.Rol.LOGISTICA]

    @property
    def puede_ver_sabana_logistica(self):
        """Solo Logística, Pagos y Admin pueden ver sábana de logística"""
        return self.rol in [self.Rol.ADMIN, self.Rol.LOGISTICA, self.Rol.PAGOS]

    # --- Operaciones Revalidación ---
    @property
    def puede_crear_operaciones_revalidacion(self):
        """Revalidaciones y Admin pueden crear operaciones de revalidación"""
        return self.rol in [self.Rol.ADMIN, self.Rol.REVALIDACIONES]

    @property
    def puede_ver_sabana_revalidacion(self):
        """Solo Revalidaciones y Admin pueden ver sábana de revalidación"""
        return self.rol in [self.Rol.ADMIN, self.Rol.REVALIDACIONES]

    # --- Pagos ---
    @property
    def puede_registrar_pagos(self):
        """Pagos y Admin pueden registrar pagos"""
        return self.rol in [self.Rol.ADMIN, self.Rol.PAGOS]

    @property
    def puede_pagar_demoras(self):
        """Solo Revalidaciones paga demoras, Pagos no"""
        return self.rol in [self.Rol.ADMIN, self.Rol.REVALIDACIONES]

    @property
    def puede_pagar_almacenajes(self):
        """Pagos y Logística pueden pagar almacenajes (modalidad T3)"""
        return self.rol in [self.Rol.ADMIN, self.Rol.PAGOS, self.Rol.LOGISTICA]

    # --- Clasificación ---
    @property
    def puede_dar_alta_clasificacion(self):
        """Solo Clasificación puede dar de alta datos iniciales"""
        return self.rol in [self.Rol.ADMIN, self.Rol.CLASIFICACION]

    @property
    def puede_dar_visto_bueno(self):
        """Solo Admin puede dar visto bueno (dirigente)"""
        return self.rol == self.Rol.ADMIN

    # --- Cotizaciones ---
    @property
    def puede_crear_cotizaciones(self):
        """Todos los roles pueden crear cotizaciones"""
        return True

    # --- Catálogos ---
    @property
    def puede_gestionar_catalogos(self):
        """Solo Admin puede gestionar catálogos"""
        return self.rol == self.Rol.ADMIN

    # --- Bitácora ---
    @property
    def puede_ver_bitacora(self):
        """Solo Admin puede ver bitácora completa"""
        return self.rol == self.Rol.ADMIN

    # ========== Métodos de utilidad ==========

    def get_conceptos_permitidos(self):
        """
        Retorna los conceptos que el usuario puede utilizar según su rol.
        """
        from apps.catalogos.models import Concepto

        if self.es_admin:
            return Concepto.objects.filter(activo=True)

        if self.es_revalidaciones:
            return Concepto.objects.filter(
                activo=True,
                tipo_rol__in=['revalidacion', 'ambos']
            )

        if self.es_logistica:
            return Concepto.objects.filter(
                activo=True,
                tipo_rol__in=['logistica', 'ambos']
            )

        return Concepto.objects.none()

    def get_sabana_disponible(self):
        """
        Retorna qué sábanas puede ver el usuario.
        """
        if self.es_admin:
            return ['logistica', 'revalidacion']
        if self.es_revalidaciones:
            return ['revalidacion']
        if self.es_logistica or self.es_pagos:
            return ['logistica']
        return []
