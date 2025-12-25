from rest_framework import serializers
from .models import Ticket
from apps.catalogos.serializers import EmpresaSerializer, ConceptoSerializer, ProveedorSerializer


class TicketListSerializer(serializers.ModelSerializer):
    """Serializer para listado de tickets (datos mínimos)"""
    ejecutivo_nombre = serializers.CharField(source='ejecutivo.nombre', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    concepto_nombre = serializers.CharField(source='concepto.nombre', read_only=True)
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
    """Serializer para detalle de ticket (datos completos)"""
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
        if user.es_ejecutivo:
            return obj.puede_ser_editado_por_ejecutivo
        return False


class TicketCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear tickets"""
    
    class Meta:
        model = Ticket
        fields = [
            'empresa', 'fecha_alta', 'concepto', 'prefijo', 'contenedor',
            'bl_master', 'pedimento', 'factura', 'proveedor',
            'importe', 'divisa', 'eta', 'dias_libres', 'observaciones'
        ]
    
    def create(self, validated_data):
        # Obtener el siguiente consecutivo para el prefijo
        prefijo = validated_data.get('prefijo', '').upper()
        validated_data['prefijo'] = prefijo
        validated_data['consecutivo'] = Ticket.obtener_siguiente_consecutivo(prefijo)
        validated_data['contenedor'] = validated_data.get('contenedor', '').upper()
        
        return super().create(validated_data)


class TicketUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar tickets.
    El rol Revalidaciones solo puede editar ETA y días libres.
    """
    
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
        
        # Si es ejecutivo, verificar límite de ediciones
        if user.es_ejecutivo and instance:
            if not instance.puede_ser_editado_por_ejecutivo:
                raise serializers.ValidationError(
                    'Has alcanzado el límite de 2 ediciones. Contacta al administrador.'
                )
            
            # Solo permitir editar ETA y días libres
            campos_permitidos = {'eta', 'dias_libres'}
            campos_modificados = set(attrs.keys())
            campos_no_permitidos = campos_modificados - campos_permitidos
            
            if campos_no_permitidos:
                raise serializers.ValidationError(
                    f'Solo puedes editar ETA y días libres. '
                    f'Campos no permitidos: {", ".join(campos_no_permitidos)}'
                )
        
        return attrs


class TicketEditarEtaSerializer(serializers.Serializer):
    """Serializer específico para editar ETA y días libres"""
    eta = serializers.DateField(required=False)
    dias_libres = serializers.IntegerField(required=False, min_value=0)
    
    def validate(self, attrs):
        if not attrs.get('eta') and not attrs.get('dias_libres'):
            raise serializers.ValidationError(
                'Debe proporcionar al menos ETA o días libres'
            )
        return attrs
