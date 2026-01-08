from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from datetime import date, timedelta
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
        # Bloquear puerto una vez que se haya guardado por primera vez
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
        Calcula el semáforo considerando ETA y días libres.
        - AZUL: Faltan 10 días o menos para el ETA.
        - VERDE: Llegó y tiene buen tiempo de días libres.
        - AMARILLO/ROJO/VENCIDO: Se acaban los días libres.
        """
        if not self.eta:
            return 'verde'  # Sin fecha, asumimos verde

        hoy = date.today()

        # --- LÓGICA NUEVA: PREVIO A LA LLEGADA (AZUL) ---
        if hoy < self.eta:
            dias_para_llegar = (self.eta - hoy).days
            # Si faltan 10 días o menos para llegar, es AZUL (Pre-alerta)
            if dias_para_llegar <= 10:
                return 'azul'
            return 'verde' # Si falta mucho más, se mantiene verde

        # --- LÓGICA EXISTENTE: POST LLEGADA (Días Libres) ---
        # Fecha Límite = ETA + Días Libres
        fecha_limite = self.eta + timedelta(days=self.dias_libres)
        dias_restantes = (fecha_limite - hoy).days

        if dias_restantes < 0:
            return 'vencido'  # Morado
        elif dias_restantes <= 2: 
            return 'rojo'     # Crítico
        elif dias_restantes <= 5:
            return 'amarillo' # Preventivo
        else:
            return 'verde'    # A tiempo


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
    APOYO FERREO, RECTIFICACION, SERVICIOS, CERTIFICADOS, HONORARIOS COMER,
    NO PREVIO, PAMA
    """

    class Estatus(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PAGADO = 'pagado', 'Pagado'
        CERRADO = 'cerrado', 'Cerrado'

    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    # Relaciones principales
    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.PROTECT,
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
        verbose_name='Concepto'
    )

    # Referencia única: PREFIJO + CONSECUTIVO
    prefijo = models.CharField('Prefijo', max_length=10)
    consecutivo = models.PositiveIntegerField('Consecutivo')

    # Comentarios auto-generados: CONCEPTO PREFIJO # CONTENEDOR
    comentarios = models.CharField(
        'Comentarios',
        max_length=200,
        blank=True,
        help_text='Generado automático: CONCEPTO PREFIJO # CONTENEDOR'
    )

    # Datos documentales
    pedimento = models.CharField('Pedimento', max_length=30, blank=True)
    factura = models.CharField('Factura', max_length=30, blank=True)

    # Proveedor (terminal, transportista, etc.)
    proveedor = models.ForeignKey(
        'catalogos.Proveedor',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='operaciones_logistica',
        verbose_name='Proveedor'
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

    # Observaciones
    observaciones = models.TextField('Observaciones', blank=True)

    # Metadatos
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'operaciones_logistica'
        verbose_name = 'Operación de logística'
        verbose_name_plural = 'Operaciones de logística'
        ordering = ['-fecha', '-id']
        # unique_together = ['prefijo', 'consecutivo']

    def __str__(self):
        return f"{self.comentarios} - ${self.importe:,.2f}"

    def save(self, *args, **kwargs):
        # Generar comentarios automáticamente
        if self.concepto and self.prefijo and self.contenedor:
            self.comentarios = f"{self.concepto.nombre} {self.prefijo} {self.consecutivo} {self.contenedor.numero}"
        super().save(*args, **kwargs)

    @classmethod
    def obtener_siguiente_consecutivo(cls, prefijo):
        """Obtener el siguiente consecutivo para un prefijo dado"""
        ultimo = cls.objects.filter(prefijo=prefijo).order_by('-consecutivo').first()
        return (ultimo.consecutivo + 1) if ultimo else 1


class OperacionRevalidacion(models.Model):
    """
    Sábana operativa de Revalidaciones.
    Trabaja con NAVIERAS.
    Usa BL como ID principal.

    Conceptos de Revalidación:
    CARGOS LOCALES, CAMBIO A.A, FLETE MARITIMO, DEMORAS, GARANTIA,
    LIMPIEZA, REV TARDIA, SEGURIDAD, ISPS, TRANSITO INTERNO,
    RETRANSMISION, MULTA, SEG. REVALIDACION, SAC, T3 ALMACENAJE, CEDI
    """

    class Estatus(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PAGADO = 'pagado', 'Pagado'

    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    # Relaciones principales
    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.PROTECT,
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

    # BL es el ID principal para revalidaciones
    bl = models.CharField('BL', max_length=50)

    concepto = models.ForeignKey(
        'catalogos.Concepto',
        on_delete=models.PROTECT,
        related_name='operaciones_revalidacion',
        verbose_name='Concepto'
    )

    # Referencia única: CLIENTE (PREFIJO) + CONSECUTIVO
    cliente_prefijo = models.CharField('Prefijo cliente', max_length=10)
    consecutivo = models.PositiveIntegerField('Consecutivo')

    # Referencia auto-generada: CONCEPTO BL PREFIJO #
    referencia = models.CharField(
        'Referencia',
        max_length=200,
        blank=True,
        help_text='Generado automático: CONCEPTO BL PREFIJO #'
    )

    # Cuenta de naviera para el pago
    naviera_cuenta = models.ForeignKey(
        'catalogos.NavieraCuenta',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='operaciones',
        verbose_name='Cuenta de naviera'
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
        default=Divisa.USD  # Revalidaciones generalmente en USD
    )
    tipo_cambio = models.DecimalField(
        'Tipo de cambio',
        max_digits=8,
        decimal_places=4,
        null=True,
        blank=True
    )

    # Estatus y pago
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.PENDIENTE
    )
    fecha_pago_tesoreria = models.DateField(
        'Fecha de pago tesorería',
        null=True,
        blank=True
    )

    # Observaciones
    observaciones = models.TextField('Observaciones', blank=True)
    observaciones_tesoreria = models.TextField(
        'Observaciones tesorería',
        blank=True,
        help_text='Ej: SE TOMA DEL SALDO DE MICRA $66,906.00'
    )

    # Metadatos
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'operaciones_revalidacion'
        verbose_name = 'Operación de revalidación'
        verbose_name_plural = 'Operaciones de revalidación'
        ordering = ['-fecha', '-id']

    def __str__(self):
        return f"{self.referencia} - ${self.importe:,.2f}"

    def save(self, *args, **kwargs):
        # Generar referencia automáticamente
        if self.concepto and self.bl and self.cliente_prefijo:
            self.referencia = f"{self.concepto.nombre} {self.bl} {self.cliente_prefijo} {self.consecutivo}"
        super().save(*args, **kwargs)

    @property
    def importe_mxn(self):
        """Calcular importe en MXN si está en USD"""
        if self.divisa == self.Divisa.USD and self.tipo_cambio:
            return self.importe * self.tipo_cambio
        return self.importe

    @classmethod
    def obtener_siguiente_consecutivo(cls, cliente_prefijo):
        """Obtener el siguiente consecutivo para un prefijo de cliente dado"""
        ultimo = cls.objects.filter(cliente_prefijo=cliente_prefijo).order_by('-consecutivo').first()
        return (ultimo.consecutivo + 1) if ultimo else 1


class Clasificacion(models.Model):
    """
    Módulo de Clasificación.
    Da de alta datos iniciales del contenedor.
    Requiere visto bueno del dirigente para proseguir.

    Clasificación da de alta:
    - Agente aduanal
    - Comercializadora
    - Consecutivo y el prefijo
    - # de factura
    - # de contenedor
    - BL
    - Tienen su propia ETA
    """

    class Estatus(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente visto bueno'
        APROBADO = 'aprobado', 'Aprobado'
        RECHAZADO = 'rechazado', 'Rechazado'

    # Relaciones principales
    contenedor = models.OneToOneField(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='clasificacion',
        verbose_name='Contenedor'
    )
    ejecutivo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='clasificaciones',
        verbose_name='Ejecutivo de clasificación'
    )

    # Datos que clasificación da de alta
    agente_aduanal = models.ForeignKey(
        'catalogos.AgenteAduanal',
        on_delete=models.PROTECT,
        related_name='clasificaciones',
        verbose_name='Agente aduanal'
    )
    comercializadora = models.ForeignKey(
        'catalogos.Comercializadora',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clasificaciones',
        verbose_name='Comercializadora'
    )

    # Identificadores
    prefijo = models.CharField('Prefijo', max_length=10)
    consecutivo = models.PositiveIntegerField('Consecutivo')
    factura = models.CharField('# de factura', max_length=30, blank=True)
    bl = models.CharField('BL', max_length=50)

    # ETA propia de clasificación
    eta = models.DateField('ETA', null=True, blank=True)

    # Visto bueno del dirigente
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.PENDIENTE
    )
    visto_bueno = models.BooleanField('Visto bueno', default=False)
    visto_bueno_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vistos_buenos',
        verbose_name='Visto bueno por'
    )
    visto_bueno_fecha = models.DateTimeField(
        'Fecha de visto bueno',
        null=True,
        blank=True
    )
    comentarios_rechazo = models.TextField(
        'Comentarios de rechazo',
        blank=True
    )

    # Metadatos
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'clasificaciones'
        verbose_name = 'Clasificación'
        verbose_name_plural = 'Clasificaciones'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Clasificación {self.contenedor.numero}"

    def aprobar(self, usuario):
        """Aprobar clasificación (dar visto bueno)"""
        from django.utils import timezone
        self.visto_bueno = True
        self.visto_bueno_por = usuario
        self.visto_bueno_fecha = timezone.now()
        self.estatus = self.Estatus.APROBADO
        self.save()

    def rechazar(self, usuario, comentarios=''):
        """Rechazar clasificación"""
        self.estatus = self.Estatus.RECHAZADO
        self.comentarios_rechazo = comentarios
        self.save()


class Documento(models.Model):
    """
    Documentos asociados a clasificaciones y contenedores.

    Tipos de documentos:
    - Factura
    - PL (Packing List)
    - Certificados
    - Constancias
    - Manifestación de valor electrónica
    - BL (Revalidación y clasificación)
    - Comprobante de pago
    - EIR (para verificar regreso de contenedor)
    """

    class TipoDocumento(models.TextChoices):
        FACTURA = 'factura', 'Factura'
        PL = 'pl', 'Packing List'
        CERTIFICADO = 'certificado', 'Certificado'
        CONSTANCIA = 'constancia', 'Constancia'
        MANIFESTACION_VALOR = 'manifestacion_valor', 'Manifestación de valor electrónica'
        BL = 'bl', 'Bill of Lading'
        COMPROBANTE_PAGO = 'comprobante_pago', 'Comprobante de pago'
        EIR = 'eir', 'EIR (Equipment Interchange Receipt)'

    # Relaciones - puede estar asociado a clasificación o contenedor
    clasificacion = models.ForeignKey(
        Clasificacion,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='documentos',
        verbose_name='Clasificación'
    )
    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='documentos',
        verbose_name='Contenedor'
    )

    # Datos del documento
    tipo = models.CharField(
        'Tipo de documento',
        max_length=30,
        choices=TipoDocumento.choices
    )
    archivo = models.FileField(
        'Archivo',
        upload_to='documentos/%Y/%m/'
    )
    nombre_archivo = models.CharField('Nombre del archivo', max_length=255)
    descripcion = models.TextField('Descripción', blank=True)

    # Metadatos
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
        return f"{self.get_tipo_display()} - {self.nombre_archivo}"


class Demora(models.Model):
    """
    Registro de demoras por contenedor.
    Pasados los días libres del contenedor comienza a cobrarse los días de demora.
    Solo Revalidaciones pagan demoras, Pagos no.
    """

    class Estatus(models.TextChoices):
        ACTIVO = 'activo', 'Activo (acumulando)'
        PAGADO = 'pagado', 'Pagado'
        CANCELADO = 'cancelado', 'Cancelado'

    class Divisa(models.TextChoices):
        MXN = 'MXN', 'Pesos Mexicanos'
        USD = 'USD', 'Dólares Americanos'

    contenedor = models.ForeignKey(
        Contenedor,
        on_delete=models.CASCADE,
        related_name='demoras',
        verbose_name='Contenedor'
    )
    naviera = models.ForeignKey(
        'catalogos.Naviera',
        on_delete=models.PROTECT,
        related_name='demoras',
        verbose_name='Naviera'
    )

    # Fechas
    fecha_inicio_demora = models.DateField(
        'Fecha inicio demora',
        help_text='Cuando terminan los días libres'
    )
    fecha_corte = models.DateField(
        'Fecha de corte',
        null=True,
        blank=True
    )

    # Cálculos
    dias_demora = models.PositiveIntegerField('Días de demora', default=0)
    costo_diario = models.DecimalField(
        'Costo diario',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    costo_total = models.DecimalField(
        'Costo total',
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

    # Estatus
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.ACTIVO
    )

    # Observaciones
    observaciones = models.TextField('Observaciones', blank=True)

    # Metadatos
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'demoras'
        verbose_name = 'Demora'
        verbose_name_plural = 'Demoras'
        ordering = ['-fecha_inicio_demora']

    def __str__(self):
        return f"Demora {self.contenedor.numero} - {self.dias_demora} días"

    def calcular_costo_total(self):
        """Calcular costo total de demoras"""
        self.costo_total = self.dias_demora * self.costo_diario
        return self.costo_total


class Garantia(models.Model):
    """
    Registro de garantías por contenedor.
    Cuando se marca como completada la operación, se tiene que verificar
    el regreso de la garantía o el EIR.

    Formato de las garantías: Fecha en la que se hizo el pago concatenado + comentarios
    """

    class Estatus(models.TextChoices):
        DEPOSITADA = 'depositada', 'Depositada'
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
        null=True,
        blank=True,
        related_name='garantias',
        verbose_name='Naviera'
    )

    # Datos financieros
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
    fecha_devolucion = models.DateField('Fecha de devolución', null=True, blank=True)

    # Formato: Fecha pago + comentarios
    comentarios = models.TextField(
        'Comentarios',
        blank=True,
        help_text='Formato: Fecha de pago + comentarios'
    )

    # Comprobante
    comprobante = models.FileField(
        'Comprobante de pago',
        upload_to='garantias/%Y/%m/',
        null=True,
        blank=True
    )

    # Estatus
    estatus = models.CharField(
        'Estatus',
        max_length=20,
        choices=Estatus.choices,
        default=Estatus.DEPOSITADA
    )

    # Verificación de regreso
    eir_recibido = models.BooleanField(
        'EIR recibido',
        default=False,
        help_text='Se verificó el regreso del contenedor'
    )
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
        return f"Garantía {self.contenedor.numero} - ${self.monto:,.2f} {self.divisa}"

    def save(self, *args, **kwargs):
        # Generar comentarios con formato: Fecha + comentarios
        if self.fecha_deposito and not self.comentarios.startswith(str(self.fecha_deposito)):
            self.comentarios = f"{self.fecha_deposito} {self.comentarios}".strip()
        super().save(*args, **kwargs)


class Prestamo(models.Model):
    """
    Capacidad para préstamos en caso de que el cliente no haya dado anticipo.
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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prestamos',
        verbose_name='Contenedor relacionado'
    )

    # Datos del préstamo
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
    contenedor = models.CharField('Contenedor', max_length=20)
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
    # NUEVOS: Campos para filtrado por sábana y puerto
    
    TIPO_OPERACION_CHOICES = [
        ('revalidaciones', 'Revalidaciones'),
        ('logistica', 'Logística'),
        ('clasificacion', 'Clasificación'),
    ]
    
    tipo_operacion = models.CharField(
        'Tipo de operación',
        max_length=20,
        choices=TIPO_OPERACION_CHOICES,
        default='revalidaciones',
        help_text='Determina en qué sábana aparece el ticket'
    )
    
    puerto = models.ForeignKey(
        'catalogos.Puerto',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name='Puerto'
    )

    class Meta:
        db_table = 'tickets'
        verbose_name = 'Ticket (Legacy)'
        verbose_name_plural = 'Tickets (Legacy)'
        ordering = ['-fecha_alta', '-id']
        #  unique_together = ['prefijo', 'consecutivo']

    def __str__(self):
        return f"{self.comentarios} - ${self.importe:,.2f}"

    def save(self, *args, **kwargs):
        identificador = self.contenedor if self.contenedor else self.bl_master
        if self.prefijo and identificador:
            concepto_nombre = ''
            if self.concepto_id:
                concepto_nombre = self.concepto.nombre
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
        """
        Calcula el semáforo considerando ETA y días libres.
        - AZUL: Faltan 10 días o menos para el ETA.
        - VERDE: Llegó y tiene buen tiempo de días libres.
        - AMARILLO/ROJO/VENCIDO: Se acaban los días libres.
        """
        if not self.eta:
            return 'verde'  # Sin fecha, asumimos verde

        hoy = date.today()

        # --- LÓGICA NUEVA: PREVIO A LA LLEGADA (AZUL) ---
        if hoy < self.eta:
            dias_para_llegar = (self.eta - hoy).days
            # Si faltan 10 días o menos para llegar, es AZUL (Pre-alerta)
            if dias_para_llegar <= 10:
                return 'azul'
            return 'verde' # Si falta mucho más, se mantiene verde

        # --- LÓGICA EXISTENTE: POST LLEGADA (Días Libres) ---
        # Fecha Límite = ETA + Días Libres
        fecha_limite = self.eta + timedelta(days=self.dias_libres)
        dias_restantes = (fecha_limite - hoy).days

        if dias_restantes < 0:
            return 'vencido'  # Morado
        elif dias_restantes <= 2: 
            return 'rojo'     # Crítico
        elif dias_restantes <= 5:
            return 'amarillo' # Preventivo
        else:
            return 'verde'    # A tiempo

    @property
    def puede_ser_editado_por_ejecutivo(self):
        return self.contador_ediciones < 2

    @classmethod
    def obtener_siguiente_consecutivo(cls, prefijo):
        ultimo = cls.objects.filter(prefijo=prefijo).order_by('-consecutivo').first()
        return (ultimo.consecutivo + 1) if ultimo else 1
