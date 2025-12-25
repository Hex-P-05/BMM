from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Pago, CierreOperacion
from .serializers import (
    PagoSerializer, PagoCreateSerializer,
    CierreOperacionSerializer, CierreOperacionCreateSerializer
)
from apps.auditoria.utils import registrar_accion


class PagoViewSet(viewsets.ModelViewSet):
    """
    API de Pagos.
    
    Permisos:
    - Admin: Acceso total
    - Pagos: Puede registrar pagos y ver listado
    - Revalidaciones: Solo lectura
    """
    queryset = Pago.objects.select_related(
        'ticket', 'ticket__empresa', 'usuario'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['ticket', 'ticket__empresa', 'usuario']
    search_fields = ['ticket__comentarios', 'ticket__contenedor', 'referencia']
    ordering_fields = ['fecha_pago', 'monto', 'fecha_registro']
    ordering = ['-fecha_pago']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PagoCreateSerializer
        return PagoSerializer
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Verificar permiso de registrar pagos
        if not user.puede_registrar_pagos:
            raise PermissionDenied('No tienes permiso para registrar pagos')
        
        pago = serializer.save(usuario=user)
        
        registrar_accion(
            usuario=user,
            accion='REGISTRAR_PAGO',
            descripcion=f'Pago registrado: ${pago.monto:,.2f} para {pago.ticket.comentarios}',
            modelo='Pago',
            objeto_id=pago.id,
            datos_nuevos={
                'monto': str(pago.monto),
                'fecha_pago': str(pago.fecha_pago),
                'dias_retraso': pago.dias_retraso
            }
        )
    
    def perform_update(self, serializer):
        user = self.request.user
        if not user.es_admin:
            raise PermissionDenied('Solo el administrador puede modificar pagos')
        serializer.save()
    
    def perform_destroy(self, instance):
        user = self.request.user
        if not user.es_admin:
            raise PermissionDenied('Solo el administrador puede eliminar pagos')
        instance.delete()


class CierreOperacionViewSet(viewsets.ModelViewSet):
    """
    API de Cierres de Operación.
    
    Genera el comprobante PDF al cerrar una operación.
    """
    queryset = CierreOperacion.objects.select_related(
        'ticket', 'ticket__empresa', 'usuario'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['ticket', 'ticket__empresa', 'usuario']
    search_fields = ['ticket__comentarios', 'ticket__contenedor']
    ordering_fields = ['fecha_cierre', 'monto_final']
    ordering = ['-fecha_cierre']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CierreOperacionCreateSerializer
        return CierreOperacionSerializer
    
    def perform_create(self, serializer):
        user = self.request.user
        
        cierre = serializer.save(usuario=user)
        
        registrar_accion(
            usuario=user,
            accion='CERRAR_OPERACION',
            descripcion=f'Operación cerrada: {cierre.ticket.comentarios}',
            modelo='CierreOperacion',
            objeto_id=cierre.id,
            datos_nuevos={
                'monto_final': str(cierre.monto_final),
                'ticket': cierre.ticket.id
            }
        )
    
    @action(detail=True, methods=['get'])
    def datos_comprobante(self, request, pk=None):
        """Obtener datos formateados para generar el comprobante PDF"""
        cierre = self.get_object()
        ticket = cierre.ticket
        
        return Response({
            'empresa': ticket.empresa.nombre if ticket.empresa else '',
            'bl': ticket.bl_master,
            'contenedor': ticket.contenedor,
            'comentarios': ticket.comentarios,
            'fecha_cierre': cierre.fecha_cierre.strftime('%d/%m/%Y'),
            'monto_final': float(cierre.monto_final),
            'divisa': ticket.divisa,
            'desglose': cierre.desglose,
            'observaciones': cierre.observaciones
        })
