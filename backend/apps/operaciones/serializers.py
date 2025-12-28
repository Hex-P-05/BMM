from rest_framework import serializers
from .models import (
    Contenedor, Pedimento, OperacionLogistica, OperacionRevalidacion,
    Clasificacion, Documento, Demora, Garantia, Prestamo, SaldoTesoreria, Ticket
)
from apps.catalogos.serializers import (
    EmpresaSerializer, ConceptoSerializer, ProveedorSerializer,
    ClienteSerializer, NavieraCuentaSerializer, PuertoSerializer,
    TerminalSerializer, NavieraSerializer
)


# ============ CONTENEDOR ============

class ContenedorListSerializer(serializers.ModelSerializer):
    """Serializer para listado de contenedores"""
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    cliente_prefijo = serializers.CharField(source='cliente.prefijo', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    puerto_nombre = serializers.CharField(source='puerto.nombre', read_only=True)
    terminal_nombre = serializers.CharField(source='terminal.nombre', read_only=True)
    naviera_nombre = serializers.CharField(source='naviera.nombre', read_only=True)
    ejecutivo_logistica_nombre = serializers.CharField(
        source='ejecutivo_logistica.nombre', read_only=True
    )
    ejecutivo_revalidacion_nombre = serializers.CharField(
        source='ejecutivo_revalidacion.nombre', read_only=True
    )
    semaforo = serializers.CharField(read_only=True)
    dias_restantes_libres = serializers.IntegerField(read_only=True)
    en_demora = serializers.BooleanField(read_only=True)
    dias_demora_acumulados = serializers.IntegerField(read_only=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)

    class Meta:
        model = Contenedor
        fields = [
            'id', 'numero', 'cliente', 'cliente_nombre', 'cliente_prefijo',
            'empresa', 'empresa_nombre', 'bl_master',
            'puerto', 'puerto_nombre', 'puerto_bloqueado',
            'terminal', 'terminal_nombre', 'naviera', 'naviera_nombre',
            'eta', 'dias_libres', 'fecha_ingreso',
            'estatus', 'estatus_display',
            'ejecutivo_logistica', 'ejecutivo_logistica_nombre',
            'ejecutivo_revalidacion', 'ejecutivo_revalidacion_nombre',
            'semaforo', 'dias_restantes_libres', 'en_demora', 'dias_demora_acumulados',
            'fecha_creacion', 'fecha_actualizacion'
        ]


class ContenedorDetailSerializer(ContenedorListSerializer):
    """Serializer para detalle de contenedor con relaciones"""
    cliente_data = ClienteSerializer(source='cliente', read_only=True)
    empresa_data = EmpresaSerializer(source='empresa', read_only=True)
    puerto_data = PuertoSerializer(source='puerto', read_only=True)
    terminal_data = TerminalSerializer(source='terminal', read_only=True)
    naviera_data = NavieraSerializer(source='naviera', read_only=True)

    class Meta(ContenedorListSerializer.Meta):
        fields = ContenedorListSerializer.Meta.fields + [
            'cliente_data', 'empresa_data', 'puerto_data',
            'terminal_data', 'naviera_data'
        ]


class ContenedorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear contenedores"""

    class Meta:
        model = Contenedor
        fields = [
            'numero', 'cliente', 'empresa', 'bl_master',
            'puerto', 'terminal', 'naviera',
            'eta', 'dias_libres', 'fecha_ingreso',
            'ejecutivo_logistica', 'ejecutivo_revalidacion'
        ]

    def create(self, validated_data):
        validated_data['numero'] = validated_data.get('numero', '').upper()
        validated_data['bl_master'] = validated_data.get('bl_master', '').upper()
        return super().create(validated_data)


# ============ PEDIMENTO ============

class PedimentoSerializer(serializers.ModelSerializer):
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)
    agente_nombre = serializers.CharField(source='agente_aduanal.nombre', read_only=True)
    comercializadora_nombre = serializers.CharField(
        source='comercializadora.nombre', read_only=True
    )
    a_nombre_de_display = serializers.CharField(source='get_a_nombre_de_display', read_only=True)

    class Meta:
        model = Pedimento
        fields = [
            'id', 'numero', 'contenedor', 'contenedor_numero',
            'agente_aduanal', 'agente_nombre',
            'comercializadora', 'comercializadora_nombre',
            'a_nombre_de', 'a_nombre_de_display',
            'es_operacion_inicial', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


# ============ OPERACION LOGISTICA ============

class OperacionLogisticaListSerializer(serializers.ModelSerializer):
    """Sábana de Logística - trabaja con TERMINALES, usa # CONTENEDOR como ID"""
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)
    cliente_prefijo = serializers.CharField(source='contenedor.cliente.prefijo', read_only=True)
    ejecutivo_nombre = serializers.CharField(source='ejecutivo.nombre', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    concepto_nombre = serializers.CharField(source='concepto.nombre', read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    proveedor_banco = serializers.CharField(source='proveedor.banco', read_only=True)
    proveedor_cuenta = serializers.CharField(source='proveedor.cuenta', read_only=True)
    proveedor_clabe = serializers.CharField(source='proveedor.clabe', read_only=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    divisa_display = serializers.CharField(source='get_divisa_display', read_only=True)

    class Meta:
        model = OperacionLogistica
        fields = [
            'id', 'contenedor', 'contenedor_numero', 'cliente_prefijo',
            'ejecutivo', 'ejecutivo_nombre', 'empresa', 'empresa_nombre',
            'fecha', 'concepto', 'concepto_nombre',
            'prefijo', 'consecutivo', 'comentarios',
            'pedimento', 'factura',
            'proveedor', 'proveedor_nombre', 'proveedor_banco',
            'proveedor_cuenta', 'proveedor_clabe',
            'importe', 'divisa', 'divisa_display',
            'estatus', 'estatus_display', 'fecha_pago',
            'observaciones', 'fecha_creacion', 'fecha_actualizacion'
        ]


class OperacionLogisticaCreateSerializer(serializers.ModelSerializer):
    """Crear operación de logística"""

    class Meta:
        model = OperacionLogistica
        fields = [
            'contenedor', 'empresa', 'fecha', 'concepto',
            'prefijo', 'pedimento', 'factura', 'proveedor',
            'importe', 'divisa', 'observaciones'
        ]

    def create(self, validated_data):
        prefijo = validated_data.get('prefijo', '').upper()
        validated_data['prefijo'] = prefijo
        validated_data['consecutivo'] = OperacionLogistica.obtener_siguiente_consecutivo(prefijo)
        return super().create(validated_data)


# ============ OPERACION REVALIDACION ============

class OperacionRevalidacionListSerializer(serializers.ModelSerializer):
    """Sábana de Revalidaciones - trabaja con NAVIERAS, usa BL como ID"""
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)
    ejecutivo_nombre = serializers.CharField(source='ejecutivo.nombre', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    concepto_nombre = serializers.CharField(source='concepto.nombre', read_only=True)
    naviera_cuenta_info = NavieraCuentaSerializer(source='naviera_cuenta', read_only=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    divisa_display = serializers.CharField(source='get_divisa_display', read_only=True)
    importe_mxn = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = OperacionRevalidacion
        fields = [
            'id', 'contenedor', 'contenedor_numero',
            'ejecutivo', 'ejecutivo_nombre', 'empresa', 'empresa_nombre',
            'fecha', 'bl', 'concepto', 'concepto_nombre',
            'prefijo', 'consecutivo', 'referencia', 'comentarios',
            'naviera_cuenta', 'naviera_cuenta_info',
            'importe', 'divisa', 'divisa_display', 'tipo_cambio', 'importe_mxn',
            'estatus', 'estatus_display',
            'fecha_pago_solicitado', 'fecha_pago_tesoreria',
            'observaciones', 'observaciones_tesoreria',
            'fecha_creacion', 'fecha_actualizacion'
        ]


class OperacionRevalidacionCreateSerializer(serializers.ModelSerializer):
    """Crear operación de revalidación"""

    class Meta:
        model = OperacionRevalidacion
        fields = [
            'contenedor', 'empresa', 'fecha', 'bl', 'concepto',
            'prefijo', 'naviera_cuenta',
            'importe', 'divisa', 'tipo_cambio', 'observaciones'
        ]

    def create(self, validated_data):
        prefijo = validated_data.get('prefijo', '').upper()
        validated_data['prefijo'] = prefijo
        validated_data['consecutivo'] = OperacionRevalidacion.obtener_siguiente_consecutivo(prefijo)
        return super().create(validated_data)


# ============ CLASIFICACION ============

class ClasificacionSerializer(serializers.ModelSerializer):
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)
    clasificado_por_nombre = serializers.CharField(source='clasificado_por.nombre', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.nombre', read_only=True)

    class Meta:
        model = Clasificacion
        fields = [
            'id', 'contenedor', 'contenedor_numero',
            'clasificado_por', 'clasificado_por_nombre',
            'descripcion_mercancia', 'fraccion_arancelaria',
            'requiere_visto_bueno', 'visto_bueno_otorgado',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'observaciones', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


# ============ DOCUMENTO ============

class DocumentoSerializer(serializers.ModelSerializer):
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    subido_por_nombre = serializers.CharField(source='subido_por.nombre', read_only=True)

    class Meta:
        model = Documento
        fields = [
            'id', 'contenedor', 'contenedor_numero',
            'tipo', 'tipo_display', 'numero', 'archivo', 'notas',
            'subido_por', 'subido_por_nombre', 'fecha_subida'
        ]
        read_only_fields = ['id', 'fecha_subida']


# ============ DEMORA ============

class DemoraSerializer(serializers.ModelSerializer):
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)

    class Meta:
        model = Demora
        fields = [
            'id', 'contenedor', 'contenedor_numero',
            'fecha_inicio', 'fecha_fin', 'dias', 'tarifa_diaria',
            'costo_calculado', 'pagada', 'fecha_pago', 'observaciones'
        ]
        read_only_fields = ['id', 'dias', 'costo_calculado']


# ============ GARANTIA ============

class GarantiaSerializer(serializers.ModelSerializer):
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)
    naviera_nombre = serializers.CharField(source='naviera.nombre', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.nombre', read_only=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    divisa_display = serializers.CharField(source='get_divisa_display', read_only=True)

    class Meta:
        model = Garantia
        fields = [
            'id', 'contenedor', 'contenedor_numero',
            'naviera', 'naviera_nombre',
            'monto', 'divisa', 'divisa_display',
            'fecha_deposito', 'fecha_devolucion',
            'comentarios', 'comprobante',
            'estatus', 'estatus_display',
            'eir_recibido', 'eir_documento',
            'registrado_por', 'registrado_por_nombre', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


# ============ PRESTAMO ============

class PrestamoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    cliente_prefijo = serializers.CharField(source='cliente.prefijo', read_only=True)
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.nombre', read_only=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    divisa_display = serializers.CharField(source='get_divisa_display', read_only=True)

    class Meta:
        model = Prestamo
        fields = [
            'id', 'cliente', 'cliente_nombre', 'cliente_prefijo',
            'contenedor', 'contenedor_numero',
            'monto', 'divisa', 'divisa_display', 'motivo',
            'fecha_prestamo', 'fecha_vencimiento', 'fecha_liquidacion',
            'estatus', 'estatus_display',
            'registrado_por', 'registrado_por_nombre', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


# ============ SALDO TESORERIA ============

class SaldoTesoreriaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = SaldoTesoreria
        fields = [
            'id', 'cliente', 'cliente_nombre',
            'empresa', 'empresa_nombre',
            'cuenta_origen', 'monto', 'tipo', 'tipo_display', 'referencia',
            'saldo_anterior', 'saldo_nuevo',
            'fecha', 'registrado_por', 'registrado_por_nombre', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


# ============ TICKET LEGACY ============

class TicketListSerializer(serializers.ModelSerializer):
    """Serializer para listado de tickets (datos mínimos) - LEGACY"""
    ejecutivo_nombre = serializers.CharField(source='ejecutivo.nombre', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    concepto_nombre = serializers.CharField(source='concepto.nombre', read_only=True, allow_null=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    proveedor_banco = serializers.CharField(source='proveedor.banco', read_only=True)
    proveedor_cuenta = serializers.CharField(source='proveedor.cuenta', read_only=True)
    proveedor_clabe = serializers.CharField(source='proveedor.clabe', read_only=True)
    semaforo = serializers.CharField(read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ejecutivo', 'ejecutivo_nombre',
            'empresa', 'empresa_nombre',
            'fecha_alta', 'comentarios',
            'concepto', 'concepto_nombre',
            'prefijo', 'consecutivo', 'contenedor',
            'bl_master', 'pedimento', 'factura',
            'proveedor', 'proveedor_nombre', 'proveedor_banco',
            'proveedor_cuenta', 'proveedor_clabe',
            'importe', 'divisa',
            'estatus', 'estatus_display', 'fecha_pago',
            'eta', 'dias_libres', 'dias_restantes', 'semaforo',
            'contador_ediciones', 'observaciones',
            'fecha_creacion', 'fecha_actualizacion'
        ]


class TicketDetailSerializer(TicketListSerializer):
    """Serializer para detalle de ticket (datos completos) - LEGACY"""
    empresa_data = EmpresaSerializer(source='empresa', read_only=True)
    concepto_data = ConceptoSerializer(source='concepto', read_only=True)
    proveedor_data = ProveedorSerializer(source='proveedor', read_only=True)
    puede_editar = serializers.SerializerMethodField()

    class Meta(TicketListSerializer.Meta):
        fields = TicketListSerializer.Meta.fields + [
            'empresa_data', 'concepto_data', 'proveedor_data', 'puede_editar'
        ]

    def get_puede_editar(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False

        user = request.user
        if user.es_admin:
            return True
        if hasattr(user, 'es_ejecutivo') and user.es_ejecutivo:
            return obj.puede_ser_editado_por_ejecutivo
        return False


class TicketCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear tickets - LEGACY (concepto ahora es opcional)"""
    concepto = serializers.PrimaryKeyRelatedField(
        queryset=None,  # Se setea en __init__
        required=False,
        allow_null=True
    )

    class Meta:
        model = Ticket
        fields = [
            'empresa', 'fecha_alta', 'concepto', 'prefijo', 'contenedor',
            'bl_master', 'pedimento', 'factura', 'proveedor',
            'importe', 'divisa', 'eta', 'dias_libres', 'observaciones'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.catalogos.models import Concepto
        self.fields['concepto'].queryset = Concepto.objects.all()

    def create(self, validated_data):
        prefijo = validated_data.get('prefijo', '').upper()
        validated_data['prefijo'] = prefijo
        validated_data['consecutivo'] = Ticket.obtener_siguiente_consecutivo(prefijo)
        validated_data['contenedor'] = validated_data.get('contenedor', '').upper()
        validated_data['bl_master'] = validated_data.get('bl_master', '').upper()
        return super().create(validated_data)


class TicketUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar tickets - LEGACY"""

    class Meta:
        model = Ticket
        fields = [
            'empresa', 'fecha_alta', 'concepto', 'prefijo', 'contenedor',
            'bl_master', 'pedimento', 'factura', 'proveedor',
            'importe', 'divisa', 'eta', 'dias_libres', 'observaciones'
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        if not request:
            return attrs

        user = request.user
        instance = self.instance

        if hasattr(user, 'es_ejecutivo') and user.es_ejecutivo and instance:
            if not instance.puede_ser_editado_por_ejecutivo:
                raise serializers.ValidationError(
                    'Has alcanzado el límite de 2 ediciones. Contacta al administrador.'
                )

            campos_permitidos = {'eta', 'dias_libres'}
            campos_modificados = set(attrs.keys())
            campos_no_permitidos = campos_modificados - campos_permitidos

            if campos_no_permitidos:
                raise serializers.ValidationError(
                    f'Solo puedes editar ETA y días libres. '
                    f'Campos no permitidos: {", ".join(campos_no_permitidos)}'
                )

        return attrs


class TicketEditarEtaSerializer(serializers.ModelSerializer):
    """Serializer para editar solo ETA, fechas y días libres (rol revalidaciones)"""

    class Meta:
        model = Ticket
        fields = ['eta', 'dias_libres', 'fecha_pago', 'fecha_alta']

    def update(self, instance, validated_data):
        # Incrementar contador de ediciones si no es admin
        request = self.context.get('request')
        if request and hasattr(request.user, 'es_admin') and not request.user.es_admin:
            instance.contador_ediciones += 1
        
        return super().update(instance, validated_data)