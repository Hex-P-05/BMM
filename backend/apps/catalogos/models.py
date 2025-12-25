from django.db import models


class Empresa(models.Model):
    """
    Catálogo de empresas/clientes frecuentes.
    Del Excel: B&MM, MICRA, HARUT
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    razon_social = models.CharField('Razón social', max_length=200, blank=True)
    rfc = models.CharField('RFC', max_length=13, blank=True)
    activo = models.BooleanField('Activo', default=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    
    class Meta:
        db_table = 'cat_empresas'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Concepto(models.Model):
    """
    Catálogo de conceptos de operación.
    Del Excel: PAMA, ALMACENAJES, UVA, FLETE, CIERRE DE CUENTA, 
    HONORARIOS AA, ANTICIPO, IMPUESTOS, NO PREVIO, MANIOBRA DE DESCARGA, etc.
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    descripcion = models.TextField('Descripción', blank=True)
    activo = models.BooleanField('Activo', default=True)
    
    class Meta:
        db_table = 'cat_conceptos'
        verbose_name = 'Concepto'
        verbose_name_plural = 'Conceptos'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Proveedor(models.Model):
    """
    Catálogo de proveedores con datos bancarios.
    Del Excel: CAREVO LOGISTICA, RR UNIDAD DE VERIFICACION, etc.
    """
    nombre = models.CharField('Nombre', max_length=200, unique=True)
    banco = models.CharField('Banco', max_length=50, blank=True)
    cuenta = models.CharField('Número de cuenta', max_length=30, blank=True)
    clabe = models.CharField('CLABE interbancaria', max_length=25, blank=True)
    contacto = models.CharField('Contacto', max_length=100, blank=True)
    telefono = models.CharField('Teléfono', max_length=20, blank=True)
    email = models.EmailField('Email', blank=True)
    activo = models.BooleanField('Activo', default=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    
    class Meta:
        db_table = 'cat_proveedores'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Naviera(models.Model):
    """
    Catálogo de navieras para cotizaciones.
    Ejemplos: MAERSK, HAPAG-LLOYD, COSCO, MSC, ONE, etc.
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    codigo = models.CharField('Código', max_length=10, blank=True)
    activo = models.BooleanField('Activo', default=True)
    
    class Meta:
        db_table = 'cat_navieras'
        verbose_name = 'Naviera'
        verbose_name_plural = 'Navieras'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Puerto(models.Model):
    """
    Catálogo de puertos.
    Ejemplos: MANZANILLO, LAZARO CARDENAS, VERACRUZ, etc.
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    codigo = models.CharField('Código', max_length=10, blank=True)
    activo = models.BooleanField('Activo', default=True)
    
    class Meta:
        db_table = 'cat_puertos'
        verbose_name = 'Puerto'
        verbose_name_plural = 'Puertos'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Terminal(models.Model):
    """
    Catálogo de terminales portuarias.
    Ejemplos: SSA MEXICO, CONTECON, HUTCHISON, etc.
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    puerto = models.ForeignKey(
        Puerto,
        on_delete=models.CASCADE,
        related_name='terminales',
        null=True,
        blank=True
    )
    activo = models.BooleanField('Activo', default=True)
    
    class Meta:
        db_table = 'cat_terminales'
        verbose_name = 'Terminal'
        verbose_name_plural = 'Terminales'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre
