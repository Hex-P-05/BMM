from rest_framework import serializers
from .models import Cotizacion
from apps.catalogos.serializers import ClienteSerializer, PuertoSerializer, AduanaSerializer


class CotizacionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de cotizaciones"""
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    cliente_prefijo = serializers.CharField(source='cliente.prefijo', read_only=True)
    puerto_nombre = serializers.CharField(source='puerto.nombre', read_only=True)
    divisa_display = serializers.CharField(source='get_divisa_display', read_only=True)
    referencia_generada = serializers.CharField(read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            'id', 'usuario', 'usuario_nombre',
            'cliente', 'cliente_nombre', 'cliente_prefijo',
            'razon_social', 'consecutivo', 'referencia_generada', 'fecha_emision',
            'bl_master', 'contenedor', 'puerto', 'puerto_nombre', 'naviera',
            'subtotal', 'divisa', 'divisa_display',
            'fecha_creacion'
        ]


class CotizacionDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de cotización (datos completos para PDF)"""
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    cliente_data = ClienteSerializer(source='cliente', read_only=True)
    puerto_data = PuertoSerializer(source='puerto', read_only=True)
    aduana_data = AduanaSerializer(source='aduana', read_only=True)
    divisa_display = serializers.CharField(source='get_divisa_display', read_only=True)
    desglose_costos = serializers.JSONField(read_only=True)
    referencia_generada = serializers.CharField(read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            'id', 'usuario', 'usuario_nombre',
            # Cliente
            'cliente', 'cliente_data', 'razon_social', 'consecutivo', 'referencia_generada',
            'fecha_emision',
            # Datos operativos
            'bl_master', 'contenedor',
            'puerto', 'puerto_data', 'aduana', 'aduana_data',
            'terminal', 'naviera', 'pedimento',
            'eta', 'fecha_entrega', 'dias_demoras', 'dias_almacenaje',
            # Costos
            'divisa', 'divisa_display',
            'costo_demoras', 'costo_almacenaje', 'costo_gastos_portuarios',
            'costo_operativos', 'costo_apoyo', 'costo_impuestos',
            'costo_liberacion', 'costo_transporte',
            'subtotal', 'tipo_cambio',
            # Extras
            'desglose_costos', 'observaciones',
            'fecha_creacion', 'fecha_actualizacion'
        ]


class CotizacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear cotizaciones"""

    class Meta:
        model = Cotizacion
        fields = [
            # Cliente
            'cliente', 'razon_social', 'fecha_emision',
            # Datos operativos
            'bl_master', 'contenedor', 'puerto', 'aduana',
            'terminal', 'naviera', 'pedimento',
            'eta', 'fecha_entrega', 'dias_demoras', 'dias_almacenaje',
            # Costos
            'divisa',
            'costo_demoras', 'costo_almacenaje', 'costo_gastos_portuarios',
            'costo_operativos', 'costo_apoyo', 'costo_impuestos',
            'costo_liberacion', 'costo_transporte',
            'tipo_cambio', 'observaciones'
        ]

    def validate(self, attrs):
        # Validar que al menos haya un costo
        costos = [
            attrs.get('costo_demoras', 0),
            attrs.get('costo_almacenaje', 0),
            attrs.get('costo_gastos_portuarios', 0),
            attrs.get('costo_operativos', 0),
            attrs.get('costo_apoyo', 0),
            attrs.get('costo_impuestos', 0),
            attrs.get('costo_liberacion', 0),
            attrs.get('costo_transporte', 0),
        ]

        if sum(costos) == 0:
            raise serializers.ValidationError(
                'Debe ingresar al menos un costo'
            )

        return attrs

    def create(self, validated_data):
        # Obtener siguiente consecutivo para el cliente
        cliente = validated_data.get('cliente')
        validated_data['consecutivo'] = Cotizacion.obtener_siguiente_consecutivo(cliente)
        return super().create(validated_data)


class CotizacionPDFSerializer(serializers.ModelSerializer):
    """
    Serializer con datos formateados para generar el PDF bilingüe.
    Incluye las etiquetas en chino y español según la imagen del cliente.
    """

    datos_operativos = serializers.SerializerMethodField()
    tabla_costos = serializers.SerializerMethodField()
    referencia_generada = serializers.CharField(read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            'id', 'razon_social', 'referencia_generada', 'fecha_emision',
            'datos_operativos', 'tabla_costos',
            'subtotal', 'divisa'
        ]

    def get_datos_operativos(self, obj):
        """Datos operativos con etiquetas bilingües"""
        return [
            {'chino': '提货单', 'espanol': 'BL', 'valor': obj.bl_master},
            {'chino': '容器', 'espanol': 'CONTENEDOR', 'valor': obj.contenedor},
            {'chino': '预计到达时间', 'espanol': 'ETA', 'valor': obj.eta.strftime('%d/%m/%Y') if obj.eta else ''},
            {'chino': '交货日期', 'espanol': 'FECHA DE ENTREGA', 'valor': obj.fecha_entrega.strftime('%d/%m/%Y') if obj.fecha_entrega else '', 'destacado_verde': True},
            {'chino': '卸货港', 'espanol': 'PUERTO', 'valor': obj.puerto.nombre if obj.puerto else ''},
            {'chino': '热的', 'espanol': 'TERMINAL', 'valor': obj.terminal},
            {'chino': '延误數日', 'espanol': 'DIAS DE DEMORAS', 'valor': obj.dias_demoras},
            {'chino': '儲存天數', 'espanol': 'DIAS DE ALMACENAJE', 'valor': obj.dias_almacenaje},
            {'chino': '航运公司', 'espanol': 'NAVIERA', 'valor': obj.naviera},
            {'chino': '报关单', 'espanol': 'PEDIMENTO', 'valor': obj.pedimento},
            {'chino': '海关', 'espanol': 'ADUANA', 'valor': obj.aduana.nombre if obj.aduana else ''},
        ]

    def get_tabla_costos(self, obj):
        """Tabla de costos con etiquetas bilingües"""
        return [
            {'chino': '延误', 'espanol': 'DEMORAS', 'valor': float(obj.costo_demoras)},
            {'chino': '贮存', 'espanol': 'ALMACENAJE', 'valor': float(obj.costo_almacenaje)},
            {'chino': '港口费用', 'espanol': 'GASTOS PORTUARIOS', 'valor': float(obj.costo_gastos_portuarios)},
            {'chino': '营运成本', 'espanol': 'COSTOS OPERATIVOS', 'valor': float(obj.costo_operativos)},
            {'chino': '支援', 'espanol': 'APOYO', 'valor': float(obj.costo_apoyo), 'destacado_rojo': True},
            {'chino': '税收', 'espanol': 'IMPUESTOS', 'valor': float(obj.costo_impuestos)},
            {'chino': '摆脱遗弃', 'espanol': 'LIBERACION DE ABANDONO', 'valor': float(obj.costo_liberacion)},
            {'chino': '運輸', 'espanol': 'TRANSPORTE', 'valor': float(obj.costo_transporte)},
            {'chino': '全部的', 'espanol': 'TOTAL', 'valor': float(obj.subtotal), 'destacado_amarillo': True},
        ]
