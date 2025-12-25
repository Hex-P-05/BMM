from django.db import models
from django.conf import settings


class Bitacora(models.Model):
    """
    Registro automático de acciones críticas según documento de requerimientos:
    - Quién editó una fecha
    - Quién registró un pago y cuándo
    - Cualquier acción importante del sistema
    """
    
    class TipoAccion(models.TextChoices):
        LOGIN = 'LOGIN', 'Inicio de sesión'
        LOGOUT = 'LOGOUT', 'Cierre de sesión'
        CREAR_TICKET = 'CREAR_TICKET', 'Crear ticket'
        EDITAR_TICKET = 'EDITAR_TICKET', 'Editar ticket'
        EDITAR_ETA = 'EDITAR_ETA', 'Editar fecha ETA'
        EDITAR_DIAS_LIBRES = 'EDITAR_DIAS_LIBRES', 'Editar días libres'
        REGISTRAR_PAGO = 'REGISTRAR_PAGO', 'Registrar pago'
        CERRAR_OPERACION = 'CERRAR_OPERACION', 'Cerrar operación'
        CREAR_COTIZACION = 'CREAR_COTIZACION', 'Crear cotización'
        CREAR_USUARIO = 'CREAR_USUARIO', 'Crear usuario'
        CAMBIAR_PASSWORD = 'CAMBIAR_PASSWORD', 'Cambiar contraseña'
        TOGGLE_USUARIO = 'TOGGLE_USUARIO', 'Activar/Desactivar usuario'
        CREAR_CATALOGO = 'CREAR_CATALOGO', 'Crear catálogo'
        EDITAR_CATALOGO = 'EDITAR_CATALOGO', 'Editar catálogo'
        ELIMINAR_CATALOGO = 'ELIMINAR_CATALOGO', 'Eliminar catálogo'
    
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='acciones'
    )
    accion = models.CharField(
        'Tipo de acción',
        max_length=30,
        choices=TipoAccion.choices
    )
    descripcion = models.TextField('Descripción')
    modelo = models.CharField('Modelo afectado', max_length=50, blank=True)
    objeto_id = models.PositiveIntegerField('ID del objeto', null=True, blank=True)
    datos_anteriores = models.JSONField('Datos anteriores', null=True, blank=True)
    datos_nuevos = models.JSONField('Datos nuevos', null=True, blank=True)
    ip_address = models.GenericIPAddressField('Dirección IP', null=True, blank=True)
    fecha = models.DateTimeField('Fecha y hora', auto_now_add=True)
    
    class Meta:
        db_table = 'bitacora'
        verbose_name = 'Registro de bitácora'
        verbose_name_plural = 'Bitácora de auditoría'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.usuario} - {self.get_accion_display()} - {self.fecha}"
