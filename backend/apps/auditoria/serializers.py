from rest_framework import serializers
from .models import Bitacora


class BitacoraSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)
    
    class Meta:
        model = Bitacora
        fields = [
            'id', 'usuario', 'usuario_nombre', 'accion', 'accion_display',
            'descripcion', 'modelo', 'objeto_id', 'datos_anteriores',
            'datos_nuevos', 'ip_address', 'fecha'
        ]
        read_only_fields = fields
