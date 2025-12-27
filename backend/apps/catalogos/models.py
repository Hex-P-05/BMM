from django.db import models


class Empresa(models.Model):
    """
    Catálogo de empresas operadoras.
    Del Excel: B&MM, MICRA, HARUT, TWIN, GANESHA, RAMEH, TESTRUM
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    razon_social = models.CharField('Razón social', max_length=200, blank=True)
    rfc = models.CharField('RFC', max_length=13, blank=True)
    es_principal = models.BooleanField(
        'Es empresa principal',
        default=False,
        help_text='Indica si es MICRA o B&MM (empresas principales del sistema)'
    )
    activo = models.BooleanField('Activo', default=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'cat_empresas'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Cliente(models.Model):
    """
    Catálogo de clientes con sus prefijos únicos.
    Reemplaza el concepto de "prefijo" que antes estaba embebido en tickets.
    Ejemplos: HUGO (HGO), ROSENDO (ROS), WINNIE (WIN), etc.
    """
    nombre = models.CharField('Nombre', max_length=100)
    prefijo = models.CharField('Prefijo', max_length=10, unique=True)
    empresa_asociada = models.ForeignKey(
        Empresa,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes',
        verbose_name='Empresa asociada'
    )
    contacto = models.CharField('Contacto', max_length=100, blank=True)
    telefono = models.CharField('Teléfono', max_length=20, blank=True)
    email = models.EmailField('Email', blank=True)
    activo = models.BooleanField('Activo', default=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'cat_clientes'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.prefijo})"


class AgenteAduanal(models.Model):
    """
    Catálogo de agentes aduanales con datos bancarios.
    Si cambia el agente aduanal, cambia también el pedimento.
    """
    nombre = models.CharField('Nombre', max_length=200, unique=True)
    patente = models.CharField('Número de patente', max_length=20, blank=True)
    banco = models.CharField('Banco', max_length=50, blank=True)
    cuenta = models.CharField('Número de cuenta', max_length=30, blank=True)
    clabe = models.CharField('CLABE interbancaria', max_length=25, blank=True)
    contacto = models.CharField('Contacto', max_length=100, blank=True)
    telefono = models.CharField('Teléfono', max_length=20, blank=True)
    email = models.EmailField('Email', blank=True)
    activo = models.BooleanField('Activo', default=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'cat_agentes_aduanales'
        verbose_name = 'Agente aduanal'
        verbose_name_plural = 'Agentes aduanales'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Comercializadora(models.Model):
    """
    Catálogo de comercializadoras.
    Puede ser que haya una comercializadora ajena en operaciones con MICRA.
    """
    nombre = models.CharField('Nombre', max_length=200, unique=True)
    razon_social = models.CharField('Razón social', max_length=200, blank=True)
    rfc = models.CharField('RFC', max_length=13, blank=True)
    contacto = models.CharField('Contacto', max_length=100, blank=True)
    telefono = models.CharField('Teléfono', max_length=20, blank=True)
    email = models.EmailField('Email', blank=True)
    activo = models.BooleanField('Activo', default=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'cat_comercializadoras'
        verbose_name = 'Comercializadora'
        verbose_name_plural = 'Comercializadoras'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Puerto(models.Model):
    """
    Catálogo de puertos.
    Una vez seleccionado el puerto, se bloquea el campo.
    Cada puerto tiene su propia logística y revalidaciones con conceptos independientes.
    """
    PUERTOS_CHOICES = [
        ('MZN', 'Manzanillo'),
        ('LZC', 'Lázaro Cárdenas'),
        ('VER', 'Veracruz'),
        ('CDMX', 'Ciudad de México / Pantaco'),
    ]

    nombre = models.CharField('Nombre', max_length=100, unique=True)
    codigo = models.CharField('Código', max_length=10, unique=True)
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        db_table = 'cat_puertos'
        verbose_name = 'Puerto'
        verbose_name_plural = 'Puertos'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class Terminal(models.Model):
    """
    Catálogo de terminales portuarias.
    Logística/Operaciones trabaja con terminales.
    Ejemplos: SSA MEXICO, CONTECON, HUTCHISON, CAREVO, etc.
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    puerto = models.ForeignKey(
        Puerto,
        on_delete=models.CASCADE,
        related_name='terminales',
        null=True,
        blank=True
    )
    banco = models.CharField('Banco', max_length=50, blank=True)
    cuenta = models.CharField('Número de cuenta', max_length=30, blank=True)
    clabe = models.CharField('CLABE interbancaria', max_length=25, blank=True)
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        db_table = 'cat_terminales'
        verbose_name = 'Terminal'
        verbose_name_plural = 'Terminales'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Naviera(models.Model):
    """
    Catálogo de navieras.
    Revalidaciones trabaja con navieras.
    Cada naviera tiene diferentes CLABEs e información para pago según el tipo de concepto.
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    codigo = models.CharField('Código', max_length=20, blank=True)
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        db_table = 'cat_navieras'
        verbose_name = 'Naviera'
        verbose_name_plural = 'Navieras'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class NavieraCuenta(models.Model):
    """
    Cuentas bancarias de navieras por tipo de concepto.
    Cada naviera tiene diferentes CLABEs según el tipo de pago.

    Ejemplo para COSCO:
    - COSCO (Demoras/Rev.Tardía/T3) → BANCO CITI MEXICO, cuenta 5638509
    - COSCO (Limpieza/Revalidación) → JP MORGAN CHASE, cuenta 8 8028 5643
    - COSCO (Garantía USD) → BANCO CITI MEXICO, cuenta 5638525
    - COSCO (Garantía MXN) → BANCO CITI MEXICO, cuenta 2105470
    """
    class Moneda(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    naviera = models.ForeignKey(
        Naviera,
        on_delete=models.CASCADE,
        related_name='cuentas',
        verbose_name='Naviera'
    )
    tipo_concepto = models.CharField(
        'Tipo de concepto',
        max_length=100,
        help_text='Ej: Demoras, Limpieza/Revalidación, Garantía USD, etc.'
    )
    beneficiario = models.CharField('Beneficiario', max_length=200)
    banco = models.CharField('Banco', max_length=100)
    cuenta = models.CharField('Número de cuenta', max_length=50, blank=True)
    clabe = models.CharField('CLABE interbancaria', max_length=25, blank=True)
    aba_swift = models.CharField('ABA / SWIFT', max_length=50, blank=True)
    moneda = models.CharField(
        'Moneda',
        max_length=3,
        choices=Moneda.choices,
        default=Moneda.USD
    )
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        db_table = 'cat_naviera_cuentas'
        verbose_name = 'Cuenta de naviera'
        verbose_name_plural = 'Cuentas de navieras'
        ordering = ['naviera', 'tipo_concepto']
        unique_together = ['naviera', 'tipo_concepto', 'moneda']

    def __str__(self):
        return f"{self.naviera.nombre} - {self.tipo_concepto} ({self.moneda})"


class Concepto(models.Model):
    """
    Catálogo de conceptos de operación.
    Cada concepto pertenece a un rol específico (logística o revalidaciones) o ambos.
    Cada naviera/terminal puede tener conceptos propios además de los base.
    """
    class TipoRol(models.TextChoices):
        LOGISTICA = 'logistica', 'Logística/Operaciones'
        REVALIDACION = 'revalidacion', 'Revalidaciones'
        AMBOS = 'ambos', 'Ambos roles'

    nombre = models.CharField('Nombre', max_length=100)
    descripcion = models.TextField('Descripción', blank=True)
    tipo_rol = models.CharField(
        'Tipo de rol',
        max_length=20,
        choices=TipoRol.choices,
        default=TipoRol.AMBOS,
        help_text='Define qué rol puede usar este concepto'
    )
    # Relaciones opcionales para conceptos específicos
    naviera = models.ForeignKey(
        Naviera,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='conceptos',
        help_text='Si es específico de una naviera'
    )
    terminal = models.ForeignKey(
        Terminal,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='conceptos',
        help_text='Si es específico de una terminal'
    )
    puerto = models.ForeignKey(
        Puerto,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='conceptos',
        help_text='Si es específico de un puerto'
    )
    es_base = models.BooleanField(
        'Es concepto base',
        default=True,
        help_text='Los conceptos base aplican para todos'
    )
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        db_table = 'cat_conceptos'
        verbose_name = 'Concepto'
        verbose_name_plural = 'Conceptos'
        ordering = ['tipo_rol', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_rol_display()})"


class Proveedor(models.Model):
    """
    Catálogo de proveedores con datos bancarios para logística.
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


class Aduana(models.Model):
    """
    Catálogo de aduanas para cotizador.
    """
    nombre = models.CharField('Nombre', max_length=100, unique=True)
    codigo = models.CharField('Código', max_length=10, blank=True)
    puerto = models.ForeignKey(
        Puerto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='aduanas'
    )
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        db_table = 'cat_aduanas'
        verbose_name = 'Aduana'
        verbose_name_plural = 'Aduanas'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre
