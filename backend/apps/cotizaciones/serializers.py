from rest_framework import serializers
from .models import Cotizacion


class CotizacionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de cotizaciones"""
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    divisa_display = serializers.CharField(source='get_divisa_display', read_only=True)
    
    class Meta:
        model = Cotizacion
        fields = [
            'id', 'usuario', 'usuario_nombre',
            'razon_social', 'referencia', 'fecha_emision',
            'bl_master', 'contenedor', 'puerto', 'naviera',
            'subtotal', 'divisa', 'divisa_display',
            'fecha_creacion'
        ]


class CotizacionDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de cotización (datos completos para PDF)"""
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    divisa_display = serializers.CharField(source='get_divisa_display', read_only=True)
    desglose_costos = serializers.JSONField(read_only=True)
    
    class Meta:
        model = Cotizacion
        fields = [
            'id', 'usuario', 'usuario_nombre',
            # Encabezado
            'razon_social', 'referencia', 'fecha_emision',
            # Datos operativos
            'bl_master', 'contenedor', 'puerto', 'terminal', 'naviera',
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
            # Encabezado
            'razon_social', 'referencia', 'fecha_emision',
            # Datos operativos
            'bl_master', 'contenedor', 'puerto', 'terminal', 'naviera',
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


class CotizacionPDFSerializer(serializers.ModelSerializer):
    """
    Serializer con datos formateados para generar el PDF bilingüe.
    Incluye las etiquetas en chino y español según la imagen del cliente.
    """
    
    datos_operativos = serializers.SerializerMethodField()
    tabla_costos = serializers.SerializerMethodField()
    
    class Meta:
        model = Cotizacion
        fields = [
            'id', 'razon_social', 'referencia', 'fecha_emision',
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
            {'chino': '卸货港', 'espanol': 'PUERTO', 'valor': obj.puerto},
            {'chino': '热的', 'espanol': 'TERMINAL', 'valor': obj.terminal},
            {'chino': '延误數日', 'espanol': 'DIAS DE DEMORAS', 'valor': obj.dias_demoras},
            {'chino': '儲存天數', 'espanol': 'DIAS DE ALMACENAJE', 'valor': obj.dias_almacenaje},
            {'chino': '航运公司', 'espanol': 'NAVIERA', 'valor': obj.naviera},
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
