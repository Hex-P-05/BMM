from rest_framework import serializers
from .models import Pago, CierreOperacion


class PagoSerializer(serializers.ModelSerializer):
    ticket_comentarios = serializers.CharField(source='ticket.comentarios', read_only=True)
    ticket_contenedor = serializers.CharField(source='ticket.contenedor', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    
    class Meta:
        model = Pago
        fields = [
            'id', 'ticket', 'ticket_comentarios', 'ticket_contenedor',
            'usuario', 'usuario_nombre',
            'monto', 'fecha_pago', 'dias_retraso',
            'concepto_pago', 'referencia', 'comprobante',
            'observaciones', 'fecha_registro'
        ]
        read_only_fields = ['id', 'usuario', 'dias_retraso', 'fecha_registro']


class PagoCreateSerializer(serializers.ModelSerializer):
    """Serializer para registrar pagos"""
    
    class Meta:
        model = Pago
        fields = [
            'ticket', 'monto', 'fecha_pago',
            'concepto_pago', 'referencia', 'comprobante', 'observaciones'
        ]
    
    def validate_ticket(self, value):
        if value.estatus == 'pagado':
            raise serializers.ValidationError('Este ticket ya está pagado')
        if value.estatus == 'cerrado':
            raise serializers.ValidationError('Este ticket ya está cerrado')
        return value


class CierreOperacionSerializer(serializers.ModelSerializer):
    ticket_comentarios = serializers.CharField(source='ticket.comentarios', read_only=True)
    ticket_contenedor = serializers.CharField(source='ticket.contenedor', read_only=True)
    ticket_empresa = serializers.CharField(source='ticket.empresa.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    
    class Meta:
        model = CierreOperacion
        fields = [
            'id', 'ticket', 'ticket_comentarios', 'ticket_contenedor', 'ticket_empresa',
            'usuario', 'usuario_nombre',
            'monto_final', 'desglose', 'observaciones', 'fecha_cierre'
        ]
        read_only_fields = ['id', 'usuario', 'fecha_cierre']


class CierreOperacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear cierre de operación"""
    
    class Meta:
        model = CierreOperacion
        fields = ['ticket', 'monto_final', 'desglose', 'observaciones']
    
    def validate_ticket(self, value):
        if value.estatus == 'cerrado':
            raise serializers.ValidationError('Este ticket ya está cerrado')
        if hasattr(value, 'cierre'):
            raise serializers.ValidationError('Este ticket ya tiene un cierre registrado')
        return value
