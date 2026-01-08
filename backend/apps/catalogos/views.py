from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Empresa, Concepto, Proveedor, Naviera, Puerto, Terminal, Cliente, AgenteAduanal
from .serializers import (
    EmpresaSerializer, ConceptoSerializer, ProveedorSerializer,
    NavieraSerializer, NavieraConCuentasSerializer, PuertoSerializer, TerminalSerializer,
    ClienteSerializer, AgenteAduanalSerializer
)
from apps.auditoria.utils import registrar_accion


class CatalogoBaseViewSet(viewsets.ModelViewSet):
    """ViewSet base para catálogos con auditoría"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    def perform_create(self, serializer):
        instance = serializer.save()
        registrar_accion(
            usuario=self.request.user,
            accion='CREAR_CATALOGO',
            descripcion=f'{self.modelo_nombre} creado: {instance}',
            modelo=self.modelo_nombre,
            objeto_id=instance.id
        )
    
    def perform_update(self, serializer):
        instance = serializer.save()
        registrar_accion(
            usuario=self.request.user,
            accion='EDITAR_CATALOGO',
            descripcion=f'{self.modelo_nombre} editado: {instance}',
            modelo=self.modelo_nombre,
            objeto_id=instance.id
        )
    
    def perform_destroy(self, instance):
        nombre = str(instance)
        objeto_id = instance.id
        instance.delete()
        registrar_accion(
            usuario=self.request.user,
            accion='ELIMINAR_CATALOGO',
            descripcion=f'{self.modelo_nombre} eliminado: {nombre}',
            modelo=self.modelo_nombre,
            objeto_id=objeto_id
        )


class EmpresaViewSet(CatalogoBaseViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    search_fields = ['nombre', 'razon_social', 'rfc']
    filterset_fields = ['activo']
    ordering_fields = ['nombre', 'fecha_creacion']
    modelo_nombre = 'Empresa'


class ConceptoViewSet(CatalogoBaseViewSet):
    queryset = Concepto.objects.all()
    serializer_class = ConceptoSerializer
    search_fields = ['nombre', 'descripcion']
    filterset_fields = ['activo']
    ordering_fields = ['nombre']
    modelo_nombre = 'Concepto'


class ProveedorViewSet(CatalogoBaseViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    search_fields = ['nombre', 'banco', 'cuenta', 'clabe']
    filterset_fields = ['activo', 'banco']
    ordering_fields = ['nombre', 'fecha_creacion']
    modelo_nombre = 'Proveedor'


class NavieraViewSet(CatalogoBaseViewSet):
    # Prefetch las cuentas para evitar N+1 queries
    queryset = Naviera.objects.prefetch_related('cuentas').all()
    # Usar serializer con cuentas incluidas para beneficiarios por concepto
    serializer_class = NavieraConCuentasSerializer
    search_fields = ['nombre', 'codigo']
    filterset_fields = ['activo']
    ordering_fields = ['nombre']
    modelo_nombre = 'Naviera'


class PuertoViewSet(CatalogoBaseViewSet):
    queryset = Puerto.objects.all()
    serializer_class = PuertoSerializer
    search_fields = ['nombre', 'codigo']
    filterset_fields = ['activo']
    ordering_fields = ['nombre']
    modelo_nombre = 'Puerto'


class TerminalViewSet(CatalogoBaseViewSet):
    queryset = Terminal.objects.select_related('puerto').all()
    serializer_class = TerminalSerializer
    search_fields = ['nombre']
    filterset_fields = ['activo', 'puerto']
    ordering_fields = ['nombre']
    modelo_nombre = 'Terminal'


class ClienteViewSet(CatalogoBaseViewSet):
    queryset = Cliente.objects.select_related('empresa_asociada').all()
    serializer_class = ClienteSerializer
    search_fields = ['nombre', 'prefijo', 'contacto', 'email']
    filterset_fields = ['activo', 'empresa_asociada']
    ordering_fields = ['nombre', 'prefijo', 'fecha_creacion']
    modelo_nombre = 'Cliente'


class AgenteAduanalViewSet(CatalogoBaseViewSet):
    queryset = AgenteAduanal.objects.all()
    serializer_class = AgenteAduanalSerializer
    search_fields = ['nombre', 'patente', 'banco']
    filterset_fields = ['activo']
    ordering_fields = ['nombre', 'fecha_creacion']
    modelo_nombre = 'AgenteAduanal'
