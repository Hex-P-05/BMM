from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from datetime import date


class Pago(models.Model):
    """
    Registro de pagos según documento de requerimientos.
    
    Funcionalidades:
    - Registrar pago de un ticket
    - Calcular días de retraso respecto al ETA
    - Guardar historial de pagos
    """
    
    ticket = models.ForeignKey(
        'operaciones.Ticket',
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Ticket'
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
    
    def __str__(self):
        return f"Pago ${self.monto:,.2f} - {self.ticket.comentarios}"
    
    def save(self, *args, **kwargs):
        # Calcular días de retraso si el ticket tiene ETA
        if self.ticket.eta and self.fecha_pago:
            delta = self.fecha_pago - self.ticket.eta
            self.dias_retraso = max(0, delta.days)
        
        # Establecer concepto por defecto
        if not self.concepto_pago:
            self.concepto_pago = self.ticket.comentarios
        
        super().save(*args, **kwargs)
        
        # Actualizar estatus del ticket
        self.ticket.estatus = 'pagado'
        self.ticket.fecha_pago = self.fecha_pago
        self.ticket.save(update_fields=['estatus', 'fecha_pago'])


class CierreOperacion(models.Model):
    """
    Registro de cierre de operaciones con generación de comprobante PDF.
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
    
    observaciones = models.TextField('Observaciones', blank=True)
    fecha_cierre = models.DateTimeField('Fecha de cierre', auto_now_add=True)
    
    class Meta:
        db_table = 'cierres_operacion'
        verbose_name = 'Cierre de operación'
        verbose_name_plural = 'Cierres de operación'
        ordering = ['-fecha_cierre']
    
    def __str__(self):
        return f"Cierre {self.ticket.comentarios} - ${self.monto_final:,.2f}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Actualizar estatus del ticket a cerrado
        self.ticket.estatus = 'cerrado'
        self.ticket.save(update_fields=['estatus'])
