from rest_framework import serializers
from .models import (
    Pago, PagoLogistica, PagoRevalidacion,
    CierreOperacion, CierreLegacy
)


# ============ PAGO GENERICO ============

class PagoSerializer(serializers.ModelSerializer):
    """Pago genérico con relación polimórfica"""
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    tipo_operacion_display = serializers.CharField(source='get_tipo_operacion_display', read_only=True)

    class Meta:
        model = Pago
        fields = [
            'id', 'content_type', 'object_id', 'tipo_operacion', 'tipo_operacion_display',
            'usuario', 'usuario_nombre',
            'monto', 'fecha_pago', 'dias_retraso',
            'concepto_pago', 'referencia', 'comprobante',
            'observaciones', 'fecha_registro'
        ]
        read_only_fields = ['id', 'usuario', 'dias_retraso', 'fecha_registro']


class PagoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear pagos genéricos"""

    class Meta:
        model = Pago
        fields = [
            'content_type', 'object_id',
            'monto', 'fecha_pago',
            'concepto_pago', 'referencia', 'comprobante',
            'observaciones'
        ]

    def validate(self, attrs):
        # Validar que la operación exista
        content_type = attrs.get('content_type')
        object_id = attrs.get('object_id')
        
        if content_type and object_id:
            model_class = content_type.model_class()
            if model_class:
                try:
                    obj = model_class.objects.get(pk=object_id)
                    if hasattr(obj, 'estatus') and obj.estatus in ['pagado', 'cerrado']:
                        raise serializers.ValidationError(
                            'Esta operación ya está pagada o cerrada'
                        )
                except model_class.DoesNotExist:
                    raise serializers.ValidationError(
                        'La operación especificada no existe'
                    )
        
        return attrs


# ============ PAGO LOGISTICA ============

class PagoLogisticaSerializer(serializers.ModelSerializer):
    """Pago específico para operaciones de logística"""
    operacion_comentarios = serializers.CharField(source='operacion.comentarios', read_only=True)
    contenedor_numero = serializers.CharField(source='operacion.contenedor.numero', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model = PagoLogistica
        fields = [
            'id', 'operacion', 'operacion_comentarios', 'contenedor_numero',
            'usuario', 'usuario_nombre',
            'monto', 'fecha_pago',
            'referencia_bancaria', 'comprobante',
            'observaciones', 'fecha_registro'
        ]
        read_only_fields = ['id', 'usuario', 'fecha_registro']


class PagoLogisticaCreateSerializer(serializers.ModelSerializer):
    """Serializer para registrar pagos de logística"""

    class Meta:
        model = PagoLogistica
        fields = [
            'operacion', 'monto', 'fecha_pago',
            'referencia_bancaria', 'comprobante', 'observaciones'
        ]

    def validate_operacion(self, value):
        if value.estatus == 'pagado':
            raise serializers.ValidationError('Esta operación ya está pagada')
        if value.estatus == 'cerrado':
            raise serializers.ValidationError('Esta operación ya está cerrada')
        return value


# ============ PAGO REVALIDACION ============

class PagoRevalidacionSerializer(serializers.ModelSerializer):
    """Pago específico para operaciones de revalidación"""
    operacion_referencia = serializers.CharField(source='operacion.referencia', read_only=True)
    bl = serializers.CharField(source='operacion.bl', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    tipo_pago_display = serializers.CharField(source='get_tipo_pago_display', read_only=True)

    class Meta:
        model = PagoRevalidacion
        fields = [
            'id', 'operacion', 'operacion_referencia', 'bl',
            'usuario', 'usuario_nombre',
            'tipo_pago', 'tipo_pago_display',
            'monto', 'fecha_pago',
            'referencia_bancaria', 'comprobante',
            'observaciones', 'observaciones_tesoreria',
            'fecha_registro'
        ]
        read_only_fields = ['id', 'usuario', 'fecha_registro']


class PagoRevalidacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para registrar pagos de revalidación"""

    class Meta:
        model = PagoRevalidacion
        fields = [
            'operacion', 'tipo_pago', 'monto', 'fecha_pago',
            'referencia_bancaria', 'comprobante',
            'observaciones', 'observaciones_tesoreria'
        ]

    def validate_operacion(self, value):
        if value.estatus == 'pagado':
            raise serializers.ValidationError('Esta operación ya está pagada')
        return value

    def validate(self, attrs):
        # Si es pago de demora, verificar que el usuario tenga permiso
        request = self.context.get('request')
        if request and attrs.get('tipo_pago') == 'demora':
            if not request.user.puede_pagar_demoras:
                raise serializers.ValidationError(
                    'No tienes permiso para registrar pagos de demora'
                )
        return attrs


# ============ CIERRE OPERACION ============

class CierreOperacionSerializer(serializers.ModelSerializer):
    """Cierre de operación para contenedores"""
    contenedor_numero = serializers.CharField(source='contenedor.numero', read_only=True)
    cliente_prefijo = serializers.CharField(source='contenedor.cliente.prefijo', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model = CierreOperacion
        fields = [
            'id', 'contenedor', 'contenedor_numero', 'cliente_prefijo',
            'usuario', 'usuario_nombre',
            'monto_final', 'desglose', 'garantias_verificadas',
            'observaciones', 'fecha_cierre'
        ]
        read_only_fields = ['id', 'usuario', 'fecha_cierre']


class CierreOperacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear cierre de operación"""

    class Meta:
        model = CierreOperacion
        fields = ['contenedor', 'monto_final', 'desglose', 'garantias_verificadas', 'observaciones']

    def validate_contenedor(self, value):
        if value.estatus == 'completado':
            raise serializers.ValidationError('Este contenedor ya está cerrado')
        if hasattr(value, 'cierre'):
            raise serializers.ValidationError('Este contenedor ya tiene un cierre registrado')
        return value

    def validate(self, attrs):
        contenedor = attrs.get('contenedor')
        # Verificar que las garantías estén verificadas si existen
        if contenedor and contenedor.garantias.filter(estatus='depositada').exists():
            if not attrs.get('garantias_verificadas', False):
                raise serializers.ValidationError(
                    'Hay garantías pendientes de verificar. Debe confirmar que se verificó el EIR.'
                )
        return attrs


# ============ CIERRE LEGACY ============

class CierreLegacySerializer(serializers.ModelSerializer):
    """Cierre para tickets legacy"""
    ticket_comentarios = serializers.CharField(source='ticket.comentarios', read_only=True)
    ticket_contenedor = serializers.CharField(source='ticket.contenedor', read_only=True)
    ticket_empresa = serializers.CharField(source='ticket.empresa.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model = CierreLegacy
        fields = [
            'id', 'ticket', 'ticket_comentarios', 'ticket_contenedor', 'ticket_empresa',
            'usuario', 'usuario_nombre',
            'monto_final', 'desglose', 'observaciones', 'fecha_cierre'
        ]
        read_only_fields = ['id', 'usuario', 'fecha_cierre']


class CierreLegacyCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear cierre legacy"""

    class Meta:
        model = CierreLegacy
        fields = ['ticket', 'monto_final', 'desglose', 'observaciones']

    def validate_ticket(self, value):
        if value.estatus == 'cerrado':
            raise serializers.ValidationError('Este ticket ya está cerrado')
        if hasattr(value, 'cierre'):
            raise serializers.ValidationError('Este ticket ya tiene un cierre registrado')
        return value