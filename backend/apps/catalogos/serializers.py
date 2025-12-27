from rest_framework import serializers
from .models import (
    Empresa, Concepto, Proveedor, Naviera, Puerto, Terminal,
    Cliente, AgenteAduanal, Comercializadora, NavieraCuenta, Aduana
)


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'razon_social', 'rfc', 'es_principal', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para clientes con prefijos únicos"""
    empresa_nombre = serializers.CharField(source='empresa_asociada.nombre', read_only=True)

    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre', 'prefijo', 'empresa_asociada', 'empresa_nombre',
            'contacto', 'telefono', 'email', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class AgenteAduanalSerializer(serializers.ModelSerializer):
    """Serializer para agentes aduanales con datos bancarios"""

    class Meta:
        model = AgenteAduanal
        fields = [
            'id', 'nombre', 'patente', 'banco', 'cuenta', 'clabe',
            'contacto', 'telefono', 'email', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class ComercializadoraSerializer(serializers.ModelSerializer):
    """Serializer para comercializadoras"""

    class Meta:
        model = Comercializadora
        fields = [
            'id', 'nombre', 'razon_social', 'rfc',
            'contacto', 'telefono', 'email', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class PuertoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puerto
        fields = ['id', 'nombre', 'codigo', 'activo']
        read_only_fields = ['id']


class TerminalSerializer(serializers.ModelSerializer):
    puerto_nombre = serializers.CharField(source='puerto.nombre', read_only=True)

    class Meta:
        model = Terminal
        fields = [
            'id', 'nombre', 'puerto', 'puerto_nombre',
            'banco', 'cuenta', 'clabe', 'activo'
        ]
        read_only_fields = ['id']


class NavieraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Naviera
        fields = ['id', 'nombre', 'codigo', 'activo']
        read_only_fields = ['id']


class NavieraCuentaSerializer(serializers.ModelSerializer):
    """Serializer para cuentas bancarias de navieras por tipo de concepto"""
    naviera_nombre = serializers.CharField(source='naviera.nombre', read_only=True)
    moneda_display = serializers.CharField(source='get_moneda_display', read_only=True)

    class Meta:
        model = NavieraCuenta
        fields = [
            'id', 'naviera', 'naviera_nombre', 'tipo_concepto',
            'beneficiario', 'banco', 'cuenta', 'clabe', 'aba_swift',
            'moneda', 'moneda_display', 'activo'
        ]
        read_only_fields = ['id']


class NavieraConCuentasSerializer(serializers.ModelSerializer):
    """Serializer para naviera con todas sus cuentas bancarias"""
    cuentas = NavieraCuentaSerializer(many=True, read_only=True)

    class Meta:
        model = Naviera
        fields = ['id', 'nombre', 'codigo', 'activo', 'cuentas']
        read_only_fields = ['id']


class ConceptoSerializer(serializers.ModelSerializer):
    tipo_rol_display = serializers.CharField(source='get_tipo_rol_display', read_only=True)
    naviera_nombre = serializers.CharField(source='naviera.nombre', read_only=True)
    terminal_nombre = serializers.CharField(source='terminal.nombre', read_only=True)
    puerto_nombre = serializers.CharField(source='puerto.nombre', read_only=True)

    class Meta:
        model = Concepto
        fields = [
            'id', 'nombre', 'descripcion', 'tipo_rol', 'tipo_rol_display',
            'naviera', 'naviera_nombre', 'terminal', 'terminal_nombre',
            'puerto', 'puerto_nombre', 'es_base', 'activo'
        ]
        read_only_fields = ['id']


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            'id', 'nombre', 'banco', 'cuenta', 'clabe',
            'contacto', 'telefono', 'email', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class AduanaSerializer(serializers.ModelSerializer):
    puerto_nombre = serializers.CharField(source='puerto.nombre', read_only=True)

    class Meta:
        model = Aduana
        fields = ['id', 'nombre', 'codigo', 'puerto', 'puerto_nombre', 'activo']
        read_only_fields = ['id']


# ============ Serializers para selects/dropdowns ============

class ClienteSelectSerializer(serializers.ModelSerializer):
    """Versión ligera para selects"""
    label = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'prefijo', 'label']

    def get_label(self, obj):
        return f"{obj.nombre} ({obj.prefijo})"


class NavieraCuentaSelectSerializer(serializers.ModelSerializer):
    """Versión ligera para selects - buscar cuenta por tipo de concepto"""
    label = serializers.SerializerMethodField()

    class Meta:
        model = NavieraCuenta
        fields = ['id', 'tipo_concepto', 'banco', 'clabe', 'moneda', 'label']

    def get_label(self, obj):
        return f"{obj.tipo_concepto} - {obj.banco} ({obj.moneda})"


class ConceptoPorRolSerializer(serializers.ModelSerializer):
    """Conceptos filtrados por rol del usuario"""

    class Meta:
        model = Concepto
        fields = ['id', 'nombre', 'descripcion', 'tipo_rol']
