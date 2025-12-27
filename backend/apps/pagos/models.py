from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from datetime import date


class Pago(models.Model):
    """
    Registro de pagos según documento de requerimientos actualizado.

    Soporta pagos a:
    - OperacionLogistica (nuevo)
    - OperacionRevalidacion (nuevo)
    - Ticket (legacy)

    Funcionalidades:
    - Registrar pago de una operación
    - Calcular días de retraso respecto al ETA
    - Guardar historial de pagos
    - Solo Revalidaciones puede pagar demoras
    - Pagos y Logística pueden pagar almacenajes (modalidad T3)
    """

    class TipoOperacion(models.TextChoices):
        LOGISTICA = 'logistica', 'Logística'
        REVALIDACION = 'revalidacion', 'Revalidación'
        LEGACY = 'legacy', 'Ticket (Legacy)'

    # Relación genérica para soportar múltiples tipos de operación
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de operación'
    )
    object_id = models.PositiveIntegerField('ID de operación')
    operacion = GenericForeignKey('content_type', 'object_id')

    # Tipo de operación (para filtrado rápido)
    tipo_operacion = models.CharField(
        'Tipo de operación',
        max_length=20,
        choices=TipoOperacion.choices,
        default=TipoOperacion.LOGISTICA
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pagos_registrados',
        verbose_name='Registrado por'
    )

    monto = models.DecimalField(
        'Monto pagado',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    fecha_pago = models.DateField('Fecha de pago', default=date.today)

    # Cálculo automático de retraso
    dias_retraso = models.IntegerField(
        'Días de retraso',
        default=0,
        help_text='Días de retraso respecto al ETA (calculado automáticamente)'
    )

    # Datos de referencia
    concepto_pago = models.CharField('Concepto del pago', max_length=200, blank=True)
    referencia = models.CharField('Referencia bancaria', max_length=100, blank=True)
    comprobante = models.FileField(
        'Comprobante',
        upload_to='comprobantes/%Y/%m/',
        blank=True,
        null=True
    )

    observaciones = models.TextField('Observaciones', blank=True)
    fecha_registro = models.DateTimeField('Fecha de registro', auto_now_add=True)

    class Meta:
        db_table = 'pagos'
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago', '-fecha_registro']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['tipo_operacion']),
        ]

    def __str__(self):
        return f"Pago ${self.monto:,.2f} - {self.concepto_pago}"

    def save(self, *args, **kwargs):
        # Determinar tipo de operación automáticamente
        if self.content_type:
            model_name = self.content_type.model
            if model_name == 'operacionlogistica':
                self.tipo_operacion = self.TipoOperacion.LOGISTICA
            elif model_name == 'operacionrevalidacion':
                self.tipo_operacion = self.TipoOperacion.REVALIDACION
            else:
                self.tipo_operacion = self.TipoOperacion.LEGACY

        super().save(*args, **kwargs)

        # Actualizar estatus de la operación
        if self.operacion:
            self.operacion.estatus = 'pagado'
            if hasattr(self.operacion, 'fecha_pago'):
                self.operacion.fecha_pago = self.fecha_pago
            elif hasattr(self.operacion, 'fecha_pago_tesoreria'):
                self.operacion.fecha_pago_tesoreria = self.fecha_pago
            self.operacion.save()


class PagoLogistica(models.Model):
    """
    Pago específico para operaciones de logística.
    Vinculado directamente a OperacionLogistica.
    """

    operacion = models.ForeignKey(
        'operaciones.OperacionLogistica',
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Operación de logística'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pagos_logistica',
        verbose_name='Registrado por'
    )

    monto = models.DecimalField(
        'Monto pagado',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    fecha_pago = models.DateField('Fecha de pago', default=date.today)

    # Datos bancarios
    referencia_bancaria = models.CharField('Referencia bancaria', max_length=100, blank=True)
    comprobante = models.FileField(
        'Comprobante',
        upload_to='comprobantes/logistica/%Y/%m/',
        blank=True,
        null=True
    )

    observaciones = models.TextField('Observaciones', blank=True)
    fecha_registro = models.DateTimeField('Fecha de registro', auto_now_add=True)

    class Meta:
        db_table = 'pagos_logistica'
        verbose_name = 'Pago de logística'
        verbose_name_plural = 'Pagos de logística'
        ordering = ['-fecha_pago', '-fecha_registro']

    def __str__(self):
        return f"Pago Logística ${self.monto:,.2f} - {self.operacion.contenedor.numero}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Actualizar estatus de la operación
        self.operacion.estatus = 'pagado'
        self.operacion.fecha_pago = self.fecha_pago
        self.operacion.save(update_fields=['estatus', 'fecha_pago'])


class PagoRevalidacion(models.Model):
    """
    Pago específico para operaciones de revalidación.
    Vinculado directamente a OperacionRevalidacion.
    Puede incluir pagos de demoras.
    """

    class TipoPago(models.TextChoices):
        NORMAL = 'normal', 'Pago normal'
        DEMORA = 'demora', 'Pago de demora'
        GARANTIA = 'garantia', 'Pago de garantía'

    operacion = models.ForeignKey(
        'operaciones.OperacionRevalidacion',
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Operación de revalidación'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pagos_revalidacion',
        verbose_name='Registrado por'
    )

    tipo_pago = models.CharField(
        'Tipo de pago',
        max_length=20,
        choices=TipoPago.choices,
        default=TipoPago.NORMAL
    )

    monto = models.DecimalField(
        'Monto pagado',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    fecha_pago = models.DateField('Fecha de pago', default=date.today)

    # Datos bancarios
    referencia_bancaria = models.CharField('Referencia bancaria', max_length=100, blank=True)
    comprobante = models.FileField(
        'Comprobante',
        upload_to='comprobantes/revalidacion/%Y/%m/',
        blank=True,
        null=True
    )

    # Observaciones de tesorería (ej: "SE TOMA DEL SALDO DE MICRA $66,906.00")
    observaciones = models.TextField('Observaciones', blank=True)
    observaciones_tesoreria = models.TextField(
        'Observaciones tesorería',
        blank=True
    )

    fecha_registro = models.DateTimeField('Fecha de registro', auto_now_add=True)

    class Meta:
        db_table = 'pagos_revalidacion'
        verbose_name = 'Pago de revalidación'
        verbose_name_plural = 'Pagos de revalidación'
        ordering = ['-fecha_pago', '-fecha_registro']

    def __str__(self):
        tipo = self.get_tipo_pago_display()
        return f"Pago Revalidación ({tipo}) ${self.monto:,.2f} - BL: {self.operacion.bl}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Actualizar estatus de la operación
        self.operacion.estatus = 'pagado'
        self.operacion.fecha_pago_tesoreria = self.fecha_pago
        if self.observaciones_tesoreria:
            self.operacion.observaciones_tesoreria = self.observaciones_tesoreria
        self.operacion.save(update_fields=['estatus', 'fecha_pago_tesoreria', 'observaciones_tesoreria'])


class CierreOperacion(models.Model):
    """
    Registro de cierre de operaciones con generación de comprobante PDF.
    Aplica a contenedores completos (todas sus operaciones).
    """

    contenedor = models.OneToOneField(
        'operaciones.Contenedor',
        on_delete=models.PROTECT,
        related_name='cierre',
        verbose_name='Contenedor'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cierres_realizados',
        verbose_name='Cerrado por'
    )

    monto_final = models.DecimalField(
        'Monto final',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    # Desglose de costos (opcional, para el comprobante)
    desglose = models.JSONField(
        'Desglose de costos',
        default=dict,
        blank=True,
        help_text='JSON con el desglose de costos para el comprobante'
    )

    # Verificación de garantías
    garantias_verificadas = models.BooleanField(
        'Garantías verificadas',
        default=False,
        help_text='Se verificó el regreso de garantías/EIR'
    )

    observaciones = models.TextField('Observaciones', blank=True)
    fecha_cierre = models.DateTimeField('Fecha de cierre', auto_now_add=True)

    class Meta:
        db_table = 'cierres_operacion'
        verbose_name = 'Cierre de operación'
        verbose_name_plural = 'Cierres de operación'
        ordering = ['-fecha_cierre']

    def __str__(self):
        return f"Cierre {self.contenedor.numero} - ${self.monto_final:,.2f}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Actualizar estatus del contenedor a completado
        self.contenedor.estatus = 'completado'
        self.contenedor.save(update_fields=['estatus'])

        # Cerrar todas las operaciones del contenedor
        self.contenedor.operaciones_logistica.filter(estatus='pendiente').update(estatus='cerrado')
        self.contenedor.operaciones_revalidacion.filter(estatus='pendiente').update(estatus='pagado')


class CierreLegacy(models.Model):
    """
    Cierre para tickets legacy (mantener compatibilidad).
    """

    ticket = models.OneToOneField(
        'operaciones.Ticket',
        on_delete=models.PROTECT,
        related_name='cierre',
        verbose_name='Ticket'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cierres_legacy',
        verbose_name='Cerrado por'
    )

    monto_final = models.DecimalField(
        'Monto final',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    desglose = models.JSONField(
        'Desglose de costos',
        default=dict,
        blank=True
    )

    observaciones = models.TextField('Observaciones', blank=True)
    fecha_cierre = models.DateTimeField('Fecha de cierre', auto_now_add=True)

    class Meta:
        db_table = 'cierres_legacy'
        verbose_name = 'Cierre (Legacy)'
        verbose_name_plural = 'Cierres (Legacy)'
        ordering = ['-fecha_cierre']

    def __str__(self):
        return f"Cierre Legacy {self.ticket.comentarios} - ${self.monto_final:,.2f}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.ticket.estatus = 'cerrado'
        self.ticket.save(update_fields=['estatus'])
