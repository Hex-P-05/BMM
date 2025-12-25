from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from datetime import date


class Ticket(models.Model):
    """
    Modelo principal de operaciones basado en la sábana de pagos real del cliente.
    
    Columnas del Excel mapeadas:
    - EJ → ejecutivo
    - EMPRESA → empresa
    - FECHA → fecha_alta
    - COMENTARIOS → comentarios (generado automático)
    - CONCEPTO → concepto
    - PREFIJO → prefijo
    - # → consecutivo
    - CONTENEDOR → contenedor
    - PEDIMENTO → pedimento
    - FACTURA → factura
    - PROVEEDOR → proveedor
    - CUENTA/CLABE/BANCO → datos del proveedor
    - IMPORTE → importe
    - ESTATUS → estatus
    - FECHA DE PAGO → fecha_pago
    - OBSERVACIONES → observaciones
    
    Campos adicionales según documento de requerimientos:
    - BL Master
    - ETA (fecha estimada de llegada)
    - Días libres
    - Contador de ediciones (max 2 para rol Revalidaciones)
    """
    
    class Estatus(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PAGADO = 'pagado', 'Pagado'
        CERRADO = 'cerrado', 'Cerrado'
    
    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'
    
    # Relación con ejecutivo que crea el ticket
    ejecutivo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='tickets',
        verbose_name='Ejecutivo'
    )
    
    # Datos de identificación
    empresa = models.ForeignKey(
        'catalogos.Empresa',
        on_delete=models.PROTECT,
        related_name='tickets',
        verbose_name='Empresa'
    )
    fecha_alta = models.DateField('Fecha de alta', default=date.today)
    
    # Datos para generar comentarios (referencia bancaria)
    concepto = models.ForeignKey(
        'catalogos.Concepto',
        on_delete=models.PROTECT,
        related_name='tickets',
        verbose_name='Concepto'
    )
    prefijo = models.CharField('Prefijo', max_length=10)
    consecutivo = models.PositiveIntegerField('Consecutivo')
    contenedor = models.CharField('Contenedor', max_length=20)
    
    # Campo generado automáticamente: CONCEPTO PREFIJO # CONTENEDOR
    comentarios = models.CharField(
        'Comentarios (Referencia)',
        max_length=100,
        blank=True,
        help_text='Generado automáticamente: CONCEPTO PREFIJO CONSECUTIVO CONTENEDOR'
    )
    
    # Datos operativos adicionales
    bl_master = models.CharField('BL Master', max_length=50, blank=True)
    pedimento = models.CharField('Pedimento', max_length=30, blank=True)
    factura = models.CharField('Factura', max_length=30, blank=True)
    
    # Datos del proveedor (beneficiario del pago)
    proveedor = models.ForeignKey(
        'catalogos.Proveedor',
        on_delete=models.PROTECT,
        related_name='tickets',
        verbose_name='Proveedor',
        null=True,
        blank=True
    )
    
    # Datos financieros
    importe = models.DecimalField(
        'Importe',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    divisa = models.CharField(
        'Divisa',
        max_length=3,
        choices=Divisa.choices,
        default=Divisa.MXN
    )
    
    # Estatus y pago
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.PENDIENTE
    )
    fecha_pago = models.DateField('Fecha de pago', null=True, blank=True)
    
    # Campos según documento de requerimientos
    eta = models.DateField('Fecha ETA', null=True, blank=True)
    dias_libres = models.PositiveIntegerField('Días libres', default=7)
    
    # Control de ediciones (máximo 2 para rol Revalidaciones)
    contador_ediciones = models.PositiveIntegerField(
        'Contador de ediciones',
        default=0,
        help_text='Máximo 2 ediciones permitidas para rol Revalidaciones'
    )
    
    # Observaciones adicionales
    observaciones = models.TextField('Observaciones', blank=True)
    
    # Metadatos
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)
    
    class Meta:
        db_table = 'tickets'
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'
        ordering = ['-fecha_alta', '-id']
        # Índice único para prefijo + consecutivo (evitar duplicados)
        unique_together = ['prefijo', 'consecutivo']
    
    def __str__(self):
        return f"{self.comentarios} - ${self.importe:,.2f}"
    
    def save(self, *args, **kwargs):
        # Generar comentarios automáticamente
        if self.concepto and self.prefijo and self.contenedor:
            self.comentarios = f"{self.concepto.nombre} {self.prefijo} {self.consecutivo} {self.contenedor}"
        super().save(*args, **kwargs)
    
    @property
    def dias_restantes(self):
        """Calcular días restantes hasta ETA"""
        if not self.eta:
            return None
        delta = self.eta - date.today()
        return delta.days
    
    @property
    def semaforo(self):
        """
        Motor de alertas según documento:
        - Verde: > 21 días restantes
        - Amarillo: 10-21 días restantes
        - Rojo: < 10 días o vencido
        """
        if not self.eta:
            return 'verde'
        
        dias = self.dias_restantes
        if dias is None:
            return 'verde'
        elif dias < 0:
            return 'vencido'
        elif dias < 10:
            return 'rojo'
        elif dias <= 21:
            return 'amarillo'
        return 'verde'
    
    @property
    def puede_ser_editado_por_ejecutivo(self):
        """Verificar si el ejecutivo puede editar (máximo 2 ediciones)"""
        return self.contador_ediciones < 2
    
    @classmethod
    def obtener_siguiente_consecutivo(cls, prefijo):
        """Obtener el siguiente consecutivo para un prefijo dado"""
        ultimo = cls.objects.filter(prefijo=prefijo).order_by('-consecutivo').first()
        return (ultimo.consecutivo + 1) if ultimo else 1
