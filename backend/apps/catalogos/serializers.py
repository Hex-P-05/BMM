from rest_framework import serializers
from .models import Empresa, Concepto, Proveedor, Naviera, Puerto, Terminal


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'razon_social', 'rfc', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class ConceptoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concepto
        fields = ['id', 'nombre', 'descripcion', 'activo']
        read_only_fields = ['id']


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            'id', 'nombre', 'banco', 'cuenta', 'clabe',
            'contacto', 'telefono', 'email', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class NavieraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Naviera
        fields = ['id', 'nombre', 'codigo', 'activo']
        read_only_fields = ['id']


class PuertoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puerto
        fields = ['id', 'nombre', 'codigo', 'activo']
        read_only_fields = ['id']


class TerminalSerializer(serializers.ModelSerializer):
    puerto_nombre = serializers.CharField(source='puerto.nombre', read_only=True)
    
    class Meta:
        model = Terminal
        fields = ['id', 'nombre', 'puerto', 'puerto_nombre', 'activo']
        read_only_fields = ['id']
