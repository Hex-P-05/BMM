from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from datetime import date
from decimal import Decimal


class Contenedor(models.Model):
    """
    Entidad central del sistema.
    Cliente está relacionado directamente con el contenedor y el pedimento.
    El puerto, una vez seleccionado, se bloquea el campo.
    """

    class Estatus(models.TextChoices):
        ACTIVO = 'activo', 'Activo'
        COMPLETADO = 'completado', 'Completado'
        CANCELADO = 'cancelado', 'Cancelado'

    # Identificador único del contenedor
    numero = models.CharField(
        'Número de contenedor',
        max_length=20,
        unique=True,
        help_text='Ej: KKFU7772489'
    )

    # Relaciones principales
    cliente = models.ForeignKey(
        'catalogos.Cliente',
        on_delete=models.PROTECT,
        related_name='contenedores',
        verbose_name='Cliente'
    )
    empresa = models.ForeignKey(
        'catalogos.Empresa',
        on_delete=models.PROTECT,
        related_name='contenedores',
        verbose_name='Empresa'
    )

    # BL Master - usado como ID en revalidaciones
    bl_master = models.CharField('BL Master', max_length=50, blank=True)

    # Puerto - una vez seleccionado se bloquea
    puerto = models.ForeignKey(
        'catalogos.Puerto',
        on_delete=models.PROTECT,
        related_name='contenedores',
        verbose_name='Puerto'
    )
    puerto_bloqueado = models.BooleanField(
        'Puerto bloqueado',
        default=False,
        help_text='Una vez seleccionado, no se puede cambiar'
    )

    # Terminal (para logística)
    terminal = models.ForeignKey(
        'catalogos.Terminal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contenedores',
        verbose_name='Terminal'
    )

    # Naviera (para revalidaciones)
    naviera = models.ForeignKey(
        'catalogos.Naviera',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contenedores',
        verbose_name='Naviera'
    )

    # Fechas importantes
    eta = models.DateField('Fecha ETA', null=True, blank=True)
    dias_libres = models.PositiveIntegerField(
        'Días libres',
        default=7,
        help_text='Pasados los días libres comienza a cobrarse demoras'
    )
    fecha_ingreso = models.DateField('Fecha de ingreso', null=True, blank=True)

    # Estatus general
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.ACTIVO
    )

    # Ejecutivos asignados por departamento
    ejecutivo_logistica = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contenedores_logistica',
        verbose_name='Ejecutivo de logística'
    )
    ejecutivo_revalidacion = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contenedores_revalidacion',
        verbose_name='Ejecutivo de revalidación'
    )

    # Metadatos
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='contenedores_creados',
        verbose_name='Creado por'
    )
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'contenedores'
        verbose_name = 'Contenedor'
        verbose_name_plural = 'Contenedores'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.numero} - {self.cliente.prefijo}"

    def save(self, *args, **kwargs):
        # Bloquear puerto después de la primera vez que se guarda
        if self.pk and not self.puerto_bloqueado:
            self.puerto_bloqueado = True
        super().save(*args, **kwargs)

    @property
    def dias_restantes_libres(self):
        """Calcular días restantes de días libres"""
        if not self.eta:
            return None
        dias_transcurridos = (date.today() - self.eta).days
        return max(0, self.dias_libres - dias_transcurridos)

    @property
    def en_demora(self):
        """Verificar si el contenedor está en período de demora"""
        if not self.eta:
            return False
        return self.dias_restantes_libres == 0

    @property
    def dias_demora_acumulados(self):
        """Calcular días de demora acumulados"""
        if not self.eta or not self.en_demora:
            return 0
        dias_transcurridos = (date.today() - self.eta).days
        return max(0, dias_transcurridos - self.dias_libres)

    @property
    def semaforo(self):
        """
        Motor de alertas:
        - Verde: > 21 días restantes
        - Amarillo: 10-21 días restantes
        - Rojo: < 10 días restantes
        - Vencido: En demora
        """
        if not self.eta:
            return 'verde'

        dias = (self.eta - date.today()).days
        if dias < 0:
            return 'vencido'
        elif dias < 10:
            return 'rojo'
        elif dias <= 21:
            return 'amarillo'
        return 'verde'


class Pedimento(models.Model):
    """
    Pedimento aduanal asociado a un contenedor.
    Si cambia el agente aduanal cambia también el pedimento.
    Si es operación inicial y el pedimento está a nombre de MICRA,
    MICRA hace todos los pagos.
    """

    class ANombreDe(models.TextChoices):
        MICRA = 'micra', 'MICRA'
        BMM = 'bmm', 'B&MM'
        CLIENTE = 'cliente', 'Cliente'

    numero = models.CharField('Número de pedimento', max_length=30)
    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='pedimentos',
        verbose_name='Contenedor'
    )
    agente_aduanal = models.ForeignKey(
        'catalogos.AgenteAduanal',
        on_delete=models.PROTECT,
        related_name='pedimentos',
        verbose_name='Agente aduanal'
    )
    comercializadora = models.ForeignKey(
        'catalogos.Comercializadora',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pedimentos',
        verbose_name='Comercializadora',
        help_text='Puede ser comercializadora ajena'
    )
    a_nombre_de = models.CharField(
        'A nombre de',
        max_length=20,
        choices=ANombreDe.choices,
        default=ANombreDe.CLIENTE,
        help_text='Si está a nombre de MICRA, MICRA hace todos los pagos'
    )
    es_operacion_inicial = models.BooleanField(
        'Es operación inicial',
        default=False
    )
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'pedimentos'
        verbose_name = 'Pedimento'
        verbose_name_plural = 'Pedimentos'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.numero} - {self.contenedor.numero}"


class OperacionLogistica(models.Model):
    """
    Sábana operativa de Logística/Operaciones.
    Trabaja con TERMINALES.
    Usa # de CONTENEDOR como ID principal.

    Conceptos de Logística:
    IMPUESTOS, HONORARIOS AA, MANIOBRAS, ALMACENAJES, CIERRE DE CUENTA,
    CONSTANCIA, COMPLEMENTO IMPUESTOS, UVA, G1, ANTICIPO, PREVIO, PROFEPA,
    FLETE, MANIOBRA DE CARGA, MANIOBRA DE DESCARGA, CONSULTA, ESTADIA,
    BURRERO, ESTADIAS EN PATIO, REEXPEDICION, FLETE EN FALSO, ESTADIAS EN JAULA,
    LIMPIEZA, RECONOCIMIENTO, VACIO, SOBREPESO, TIEMPO EXTRA DESCARGA,
    SEGURO, DEMORAS, CIERRE DE CUENTA DE CUSTODIA
    """

    class Estatus(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PAGADO = 'pagado', 'Pagado'
        CERRADO = 'cerrado', 'Cerrado'

    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    # Relaciones
    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='operaciones_logistica',
        verbose_name='Contenedor'
    )
    ejecutivo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='operaciones_logistica',
        verbose_name='Ejecutivo'
    )
    empresa = models.ForeignKey(
        'catalogos.Empresa',
        on_delete=models.PROTECT,
        related_name='operaciones_logistica',
        verbose_name='Empresa'
    )

    # Datos de la operación
    fecha = models.DateField('Fecha', default=date.today)
    concepto = models.ForeignKey(
        'catalogos.Concepto',
        on_delete=models.PROTECT,
        related_name='operaciones_logistica',
        verbose_name='Concepto',
        limit_choices_to={'tipo_rol__in': ['logistica', 'ambos']}
    )

    # Referencia única: PREFIJO + CONSECUTIVO
    prefijo = models.CharField('Prefijo', max_length=10)
    consecutivo = models.PositiveIntegerField('Consecutivo')
    comentarios = models.CharField(
        'Comentarios',
        max_length=150,
        blank=True,
        help_text='Se genera automáticamente: CONCEPTO PREFIJO CONSEC CONTENEDOR'
    )

    # Documentos
    pedimento = models.CharField('Pedimento', max_length=30, blank=True)
    factura = models.CharField('Factura', max_length=30, blank=True)

    # Proveedor (Terminal)
    proveedor = models.ForeignKey(
        'catalogos.Proveedor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='operaciones_logistica',
        verbose_name='Proveedor'
    )

    # Montos
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

    # Notas
    observaciones = models.TextField('Observaciones', blank=True)

    # Metadatos
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'operaciones_logistica'
        verbose_name = 'Operación de Logística'
        verbose_name_plural = 'Operaciones de Logística'
        ordering = ['-fecha', '-id']
        unique_together = ['prefijo', 'consecutivo']

    def __str__(self):
        return f"{self.comentarios} - ${self.importe:,.2f}"

    def save(self, *args, **kwargs):
        # Generar comentarios automáticamente
        if self.concepto and self.prefijo and self.contenedor:
            self.comentarios = f"{self.concepto.nombre} {self.prefijo} {self.consecutivo} {self.contenedor.numero}"
        super().save(*args, **kwargs)

    @classmethod
    def obtener_siguiente_consecutivo(cls, prefijo):
        ultimo = cls.objects.filter(prefijo=prefijo).order_by('-consecutivo').first()
        return (ultimo.consecutivo + 1) if ultimo else 1


class OperacionRevalidacion(models.Model):
    """
    Sábana operativa de Revalidaciones.
    Trabaja con NAVIERAS.
    Usa BL como ID principal.

    Conceptos de Revalidación:
    CARGOS LOCALES, FLETE MARÍTIMO, DEMORAS, GARANTÍA, LIMPIEZA,
    REV TARDÍA, SEGURIDAD, ISPS, TRANSITO INTERNO, RETRANSMISIÓN,
    MULTA, SEG. REVALIDACIÓN, SAC, T3 ALMACENAJE, CEDI
    """

    class Estatus(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente de pago'
        SOLICITADO = 'solicitado', 'Pago solicitado'
        PAGADO = 'pagado', 'Pagado'
        CERRADO = 'cerrado', 'Cerrado'

    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    # Relaciones
    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='operaciones_revalidacion',
        verbose_name='Contenedor'
    )
    ejecutivo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='operaciones_revalidacion',
        verbose_name='Ejecutivo'
    )
    empresa = models.ForeignKey(
        'catalogos.Empresa',
        on_delete=models.PROTECT,
        related_name='operaciones_revalidacion',
        verbose_name='Empresa'
    )

    # Datos de la operación
    fecha = models.DateField('Fecha', default=date.today)
    bl = models.CharField(
        'BL',
        max_length=50,
        help_text='Bill of Lading - ID principal para revalidaciones'
    )
    concepto = models.ForeignKey(
        'catalogos.Concepto',
        on_delete=models.PROTECT,
        related_name='operaciones_revalidacion',
        verbose_name='Concepto',
        limit_choices_to={'tipo_rol__in': ['revalidacion', 'ambos']}
    )

    # Referencia única: PREFIJO + CONSECUTIVO
    prefijo = models.CharField('Prefijo', max_length=10)
    consecutivo = models.PositiveIntegerField('Consecutivo')
    referencia = models.CharField(
        'Referencia',
        max_length=150,
        blank=True,
        help_text='Se genera automáticamente: CONCEPTO PREFIJO CONSEC BL'
    )
    comentarios = models.CharField('Comentarios', max_length=150, blank=True)

    # Cuenta de naviera para pago
    naviera_cuenta = models.ForeignKey(
        'catalogos.NavieraCuenta',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='operaciones_revalidacion',
        verbose_name='Cuenta de naviera'
    )

    # Montos
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
    tipo_cambio = models.DecimalField(
        'Tipo de cambio',
        max_digits=8,
        decimal_places=4,
        default=Decimal('1.0000'),
        help_text='TC del día para conversión USD a MXN'
    )

    # Estatus y pago
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.PENDIENTE
    )
    fecha_pago_solicitado = models.DateField(
        'Fecha pago solicitado',
        null=True,
        blank=True
    )
    fecha_pago_tesoreria = models.DateField(
        'Fecha pago tesorería',
        null=True,
        blank=True
    )

    # Notas
    observaciones = models.TextField('Observaciones', blank=True)
    observaciones_tesoreria = models.TextField(
        'Observaciones de tesorería',
        blank=True
    )

    # Metadatos
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'operaciones_revalidacion'
        verbose_name = 'Operación de Revalidación'
        verbose_name_plural = 'Operaciones de Revalidación'
        ordering = ['-fecha', '-id']
        unique_together = ['prefijo', 'consecutivo']

    def __str__(self):
        return f"{self.referencia} - ${self.importe:,.2f}"

    def save(self, *args, **kwargs):
        # Generar referencia automáticamente
        if self.concepto and self.prefijo and self.bl:
            self.referencia = f"{self.concepto.nombre} {self.prefijo} {self.consecutivo} {self.bl}"
        super().save(*args, **kwargs)

    @property
    def importe_mxn(self):
        """Calcular importe en MXN"""
        if self.divisa == 'USD':
            return self.importe * self.tipo_cambio
        return self.importe

    @classmethod
    def obtener_siguiente_consecutivo(cls, prefijo):
        ultimo = cls.objects.filter(prefijo=prefijo).order_by('-consecutivo').first()
        return (ultimo.consecutivo + 1) if ultimo else 1


class Clasificacion(models.Model):
    """
    Visto bueno del dirigente para clasificaciones.
    Solo el admin puede dar visto bueno.
    """

    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='clasificaciones',
        verbose_name='Contenedor'
    )
    clasificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='clasificaciones_realizadas',
        verbose_name='Clasificado por'
    )

    # Datos de clasificación
    descripcion_mercancia = models.TextField('Descripción de mercancía')
    fraccion_arancelaria = models.CharField(
        'Fracción arancelaria',
        max_length=20,
        blank=True
    )

    # Visto bueno del dirigente
    requiere_visto_bueno = models.BooleanField(
        'Requiere visto bueno',
        default=False
    )
    visto_bueno_otorgado = models.BooleanField(
        'Visto bueno otorgado',
        default=False
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clasificaciones_aprobadas',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(
        'Fecha de aprobación',
        null=True,
        blank=True
    )

    observaciones = models.TextField('Observaciones', blank=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'clasificaciones'
        verbose_name = 'Clasificación'
        verbose_name_plural = 'Clasificaciones'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Clasificación {self.contenedor.numero}"


class Documento(models.Model):
    """
    Documentos asociados a contenedores:
    Factura, PL (Packing List), BL (Bill of Lading), EIR
    """

    class TipoDocumento(models.TextChoices):
        FACTURA = 'factura', 'Factura'
        PL = 'pl', 'Packing List'
        BL = 'bl', 'Bill of Lading'
        EIR = 'eir', 'EIR'
        OTRO = 'otro', 'Otro'

    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='documentos',
        verbose_name='Contenedor'
    )
    tipo = models.CharField(
        'Tipo',
        max_length=20,
        choices=TipoDocumento.choices
    )
    numero = models.CharField('Número', max_length=50, blank=True)
    archivo = models.FileField(
        'Archivo',
        upload_to='documentos/%Y/%m/',
        blank=True
    )
    notas = models.TextField('Notas', blank=True)
    subido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='documentos_subidos',
        verbose_name='Subido por'
    )
    fecha_subida = models.DateTimeField('Fecha de subida', auto_now_add=True)

    class Meta:
        db_table = 'documentos'
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-fecha_subida']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.contenedor.numero}"


class Demora(models.Model):
    """
    Registro de demoras por contenedor.
    Cálculo: días * tarifa diaria
    """

    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='demoras',
        verbose_name='Contenedor'
    )
    fecha_inicio = models.DateField('Fecha inicio demora')
    fecha_fin = models.DateField('Fecha fin demora', null=True, blank=True)
    tarifa_diaria = models.DecimalField(
        'Tarifa diaria',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    pagada = models.BooleanField('Pagada', default=False)
    fecha_pago = models.DateField('Fecha de pago', null=True, blank=True)
    observaciones = models.TextField('Observaciones', blank=True)

    class Meta:
        db_table = 'demoras'
        verbose_name = 'Demora'
        verbose_name_plural = 'Demoras'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"Demora {self.contenedor.numero} - {self.dias} días"

    @property
    def dias(self):
        """Calcular días de demora"""
        fin = self.fecha_fin or date.today()
        return (fin - self.fecha_inicio).days

    @property
    def costo_calculado(self):
        """Calcular costo total de demora"""
        return self.dias * self.tarifa_diaria


class Garantia(models.Model):
    """
    Garantías depositadas a navieras.
    Se devuelve cuando se recibe el EIR del contenedor.
    """

    class Estatus(models.TextChoices):
        DEPOSITADA = 'depositada', 'Depositada'
        EN_REVISION = 'en_revision', 'En revisión'
        DEVUELTA = 'devuelta', 'Devuelta'
        APLICADA = 'aplicada', 'Aplicada a demoras'

    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='garantias',
        verbose_name='Contenedor'
    )
    naviera = models.ForeignKey(
        'catalogos.Naviera',
        on_delete=models.PROTECT,
        related_name='garantias',
        verbose_name='Naviera'
    )

    # Monto
    monto = models.DecimalField(
        'Monto',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    divisa = models.CharField(
        'Divisa',
        max_length=3,
        choices=Divisa.choices,
        default=Divisa.USD
    )

    # Fechas
    fecha_deposito = models.DateField('Fecha de depósito')
    fecha_devolucion = models.DateField(
        'Fecha de devolución',
        null=True,
        blank=True
    )

    # Documentación
    comentarios = models.CharField('Comentarios', max_length=150, blank=True)
    comprobante = models.FileField(
        'Comprobante',
        upload_to='garantias/%Y/%m/',
        blank=True
    )

    # Estatus
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.DEPOSITADA
    )

    # EIR para devolución
    eir_recibido = models.BooleanField('EIR recibido', default=False)
    eir_documento = models.ForeignKey(
        Documento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='garantias',
        verbose_name='Documento EIR'
    )

    # Metadatos
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='garantias_registradas',
        verbose_name='Registrado por'
    )
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'garantias'
        verbose_name = 'Garantía'
        verbose_name_plural = 'Garantías'
        ordering = ['-fecha_deposito']

    def __str__(self):
        return f"Garantía {self.contenedor.numero} - ${self.monto:,.2f}"


class Prestamo(models.Model):
    """
    Préstamos a clientes que no dan anticipo.
    Por ejemplo: 'CLIENTE NO DIO ANTICIPO'.
    """

    class Estatus(models.TextChoices):
        ACTIVO = 'activo', 'Activo'
        LIQUIDADO = 'liquidado', 'Liquidado'
        CANCELADO = 'cancelado', 'Cancelado'

    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    cliente = models.ForeignKey(
        'catalogos.Cliente',
        on_delete=models.PROTECT,
        related_name='prestamos',
        verbose_name='Cliente'
    )
    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='prestamos',
        verbose_name='Contenedor'
    )

    # Monto
    monto = models.DecimalField(
        'Monto',
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
    motivo = models.TextField(
        'Motivo',
        help_text='Ej: Cliente no dio anticipo'
    )

    # Fechas
    fecha_prestamo = models.DateField('Fecha del préstamo', default=date.today)
    fecha_vencimiento = models.DateField('Fecha de vencimiento', null=True, blank=True)
    fecha_liquidacion = models.DateField('Fecha de liquidación', null=True, blank=True)

    # Estatus
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.ACTIVO
    )

    # Metadatos
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='prestamos_registrados',
        verbose_name='Registrado por'
    )
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'prestamos'
        verbose_name = 'Préstamo'
        verbose_name_plural = 'Préstamos'
        ordering = ['-fecha_prestamo']

    def __str__(self):
        return f"Préstamo {self.cliente.prefijo} - ${self.monto:,.2f}"


class SaldoTesoreria(models.Model):
    """
    Tracking de saldos de tesorería para observaciones como:
    "SE TOMA DEL SALDO DE MICRA $66,906.00"
    "SALDO A FAVOR $68,331.00"
    """

    class TipoMovimiento(models.TextChoices):
        DEPOSITO = 'deposito', 'Depósito'
        USO = 'uso', 'Uso de saldo'
        DEVOLUCION = 'devolucion', 'Devolución'
        AJUSTE = 'ajuste', 'Ajuste'

    cliente = models.ForeignKey(
        'catalogos.Cliente',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='movimientos_saldo',
        verbose_name='Cliente'
    )
    empresa = models.ForeignKey(
        'catalogos.Empresa',
        on_delete=models.PROTECT,
        related_name='movimientos_saldo',
        verbose_name='Empresa'
    )

    # Datos del movimiento
    cuenta_origen = models.CharField(
        'Cuenta origen',
        max_length=100,
        help_text='Ej: MICRA SANTANDER, HARUT BANBAJIO'
    )
    monto = models.DecimalField(
        'Monto',
        max_digits=12,
        decimal_places=2
    )
    tipo = models.CharField(
        'Tipo de movimiento',
        max_length=20,
        choices=TipoMovimiento.choices
    )
    referencia = models.TextField(
        'Referencia',
        help_text='Descripción del movimiento'
    )

    # Saldo resultante
    saldo_anterior = models.DecimalField(
        'Saldo anterior',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    saldo_nuevo = models.DecimalField(
        'Saldo nuevo',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )

    # Metadatos
    fecha = models.DateField('Fecha', default=date.today)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='movimientos_saldo',
        verbose_name='Registrado por'
    )
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'saldos_tesoreria'
        verbose_name = 'Movimiento de saldo'
        verbose_name_plural = 'Movimientos de saldo'
        ordering = ['-fecha', '-id']

    def __str__(self):
        signo = '+' if self.tipo == 'deposito' else '-'
        return f"{self.cuenta_origen} {signo}${abs(self.monto):,.2f}"


# ========== MODELO LEGACY - MANTENER PARA COMPATIBILIDAD ==========

class Ticket(models.Model):
    """
    MODELO LEGACY - Mantener para compatibilidad con datos existentes.
    Las nuevas operaciones deben usar OperacionLogistica u OperacionRevalidacion.
    """

    class Estatus(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PAGADO = 'pagado', 'Pagado'
        CERRADO = 'cerrado', 'Cerrado'

    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    ejecutivo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='tickets',
        verbose_name='Ejecutivo'
    )
    empresa = models.ForeignKey(
        'catalogos.Empresa',
        on_delete=models.PROTECT,
        related_name='tickets',
        verbose_name='Empresa'
    )
    fecha_alta = models.DateField('Fecha de alta', default=date.today)
    
    # Concepto ahora es OPCIONAL
    concepto = models.ForeignKey(
        'catalogos.Concepto',
        on_delete=models.PROTECT,
        related_name='tickets',
        verbose_name='Concepto',
        null=True,
        blank=True
    )
    
    prefijo = models.CharField('Prefijo', max_length=10)
    consecutivo = models.PositiveIntegerField('Consecutivo')
    
    # Contenedor ahora es OPCIONAL (para revalidaciones que solo usan BL)
    contenedor = models.CharField('Contenedor', max_length=20, blank=True, default='')
    
    comentarios = models.CharField('Comentarios', max_length=100, blank=True)
    bl_master = models.CharField('BL Master', max_length=50, blank=True)
    pedimento = models.CharField('Pedimento', max_length=30, blank=True)
    factura = models.CharField('Factura', max_length=30, blank=True)
    proveedor = models.ForeignKey(
        'catalogos.Proveedor',
        on_delete=models.PROTECT,
        related_name='tickets',
        null=True,
        blank=True
    )
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
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.PENDIENTE
    )
    fecha_pago = models.DateField('Fecha de pago', null=True, blank=True)
    eta = models.DateField('Fecha ETA', null=True, blank=True)
    dias_libres = models.PositiveIntegerField('Días libres', default=7)
    contador_ediciones = models.PositiveIntegerField('Contador de ediciones', default=0)
    observaciones = models.TextField('Observaciones', blank=True)
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'tickets'
        verbose_name = 'Ticket (Legacy)'
        verbose_name_plural = 'Tickets (Legacy)'
        ordering = ['-fecha_alta', '-id']
        unique_together = ['prefijo', 'consecutivo']

    def __str__(self):
        return f"{self.comentarios} - ${self.importe:,.2f}"

    def save(self, *args, **kwargs):
        # Generar comentarios: usa BL si no hay contenedor (revalidaciones)
        identificador = self.contenedor if self.contenedor else self.bl_master
        if self.prefijo and identificador:
            concepto_nombre = self.concepto.nombre if self.concepto else ''
            self.comentarios = f"{concepto_nombre} {self.prefijo} {self.consecutivo} {identificador}".strip()
        super().save(*args, **kwargs)

    @property
    def dias_restantes(self):
        if not self.eta:
            return None
        delta = self.eta - date.today()
        return delta.days

    @property
    def semaforo(self):
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
        return self.contador_ediciones < 2

    @classmethod
    def obtener_siguiente_consecutivo(cls, prefijo):
        ultimo = cls.objects.filter(prefijo=prefijo).order_by('-consecutivo').first()
        return (ultimo.consecutivo + 1) if ultimo else 1