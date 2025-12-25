from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class Cotizacion(models.Model):
    """
    Módulo de cotizaciones según documento de requerimientos e imagen del cliente.
    
    Formato bilingüe (Chino Simplificado // Español) con 8 conceptos de costo fijos:
    1. Demoras (延误)
    2. Almacenaje (贮存)
    3. Gastos Portuarios (港口费用)
    4. Costos Operativos (营运成本)
    5. Apoyo (支援) - destacado en rojo
    6. Impuestos (税收)
    7. Liberación de Abandono (摆脱遗弃)
    8. Transporte (運輸)
    """
    
    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'
    
    # Usuario que crea la cotización
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cotizaciones',
        verbose_name='Creado por'
    )
    
    # A. Datos del encabezado (cliente)
    razon_social = models.CharField('Razón social', max_length=200)
    referencia = models.CharField('Referencia', max_length=100, blank=True)
    fecha_emision = models.DateField('Fecha de emisión')
    
    # B. Datos operativos
    bl_master = models.CharField('BL Master', max_length=50)
    contenedor = models.CharField('Contenedor', max_length=20)
    puerto = models.CharField('Puerto', max_length=100, default='MANZANILLO')
    terminal = models.CharField('Terminal', max_length=100, blank=True)
    naviera = models.CharField('Naviera', max_length=100, blank=True)
    eta = models.DateField('ETA', null=True, blank=True)
    fecha_entrega = models.DateField('Fecha de entrega', null=True, blank=True)
    dias_demoras = models.PositiveIntegerField('Días de demoras', default=0)
    dias_almacenaje = models.PositiveIntegerField('Días de almacenaje', default=0)
    
    # C. Desglose de costos (8 conceptos fijos)
    divisa = models.CharField(
        'Divisa',
        max_length=3,
        choices=Divisa.choices,
        default=Divisa.MXN
    )
    
    # Los 8 conceptos según la imagen
    costo_demoras = models.DecimalField(
        '延误 / Demoras',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)]
    )
    costo_almacenaje = models.DecimalField(
        '贮存 / Almacenaje',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)]
    )
    costo_gastos_portuarios = models.DecimalField(
        '港口费用 / Gastos Portuarios',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)]
    )
    costo_operativos = models.DecimalField(
        '营运成本 / Costos Operativos',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)]
    )
    costo_apoyo = models.DecimalField(
        '支援 / Apoyo',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)],
        help_text='Este concepto se destaca en rojo en el PDF'
    )
    costo_impuestos = models.DecimalField(
        '税收 / Impuestos',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)]
    )
    costo_liberacion = models.DecimalField(
        '摆脱遗弃 / Liberación de Abandono',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)]
    )
    costo_transporte = models.DecimalField(
        '運輸 / Transporte',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)]
    )
    
    # Subtotal calculado automáticamente
    subtotal = models.DecimalField(
        '全部的 / Total',
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0)]
    )
    
    # Tipo de cambio (opcional, para cotizaciones en USD)
    tipo_cambio = models.DecimalField(
        'Tipo de cambio',
        max_digits=8,
        decimal_places=4,
        null=True,
        blank=True,
        help_text='Tipo de cambio USD/MXN'
    )
    
    observaciones = models.TextField('Observaciones', blank=True)
    
    # Metadatos
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)
    
    class Meta:
        db_table = 'cotizaciones'
        verbose_name = 'Cotización'
        verbose_name_plural = 'Cotizaciones'
        ordering = ['-fecha_emision', '-id']
    
    def __str__(self):
        return f"Cotización {self.contenedor} - {self.razon_social}"
    
    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal = (
            self.costo_demoras +
            self.costo_almacenaje +
            self.costo_gastos_portuarios +
            self.costo_operativos +
            self.costo_apoyo +
            self.costo_impuestos +
            self.costo_liberacion +
            self.costo_transporte
        )
        super().save(*args, **kwargs)
    
    @property
    def desglose_costos(self):
        """Retorna el desglose de costos como diccionario"""
        return {
            'demoras': {'chino': '延误', 'espanol': 'Demoras', 'valor': float(self.costo_demoras)},
            'almacenaje': {'chino': '贮存', 'espanol': 'Almacenaje', 'valor': float(self.costo_almacenaje)},
            'gastos_portuarios': {'chino': '港口费用', 'espanol': 'Gastos Portuarios', 'valor': float(self.costo_gastos_portuarios)},
            'operativos': {'chino': '营运成本', 'espanol': 'Costos Operativos', 'valor': float(self.costo_operativos)},
            'apoyo': {'chino': '支援', 'espanol': 'Apoyo', 'valor': float(self.costo_apoyo), 'destacado': True},
            'impuestos': {'chino': '税收', 'espanol': 'Impuestos', 'valor': float(self.costo_impuestos)},
            'liberacion': {'chino': '摆脱遗弃', 'espanol': 'Liberación de Abandono', 'valor': float(self.costo_liberacion)},
            'transporte': {'chino': '運輸', 'espanol': 'Transporte', 'valor': float(self.costo_transporte)},
        }
