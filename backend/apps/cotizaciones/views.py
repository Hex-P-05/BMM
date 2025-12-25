from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import requests
from decimal import Decimal
from datetime import date

from .models import Cotizacion
from .serializers import (
    CotizacionListSerializer, CotizacionDetailSerializer,
    CotizacionCreateSerializer, CotizacionPDFSerializer
)
from apps.auditoria.utils import registrar_accion


class CotizacionViewSet(viewsets.ModelViewSet):
    """
    API de Cotizaciones.
    
    Herramienta independiente para generación de documentos comerciales
    con formato bilingüe (Chino/Español).
    """
    queryset = Cotizacion.objects.select_related('usuario').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['divisa', 'usuario']
    search_fields = ['razon_social', 'contenedor', 'bl_master']
    ordering_fields = ['fecha_emision', 'subtotal', 'fecha_creacion']
    ordering = ['-fecha_emision']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CotizacionCreateSerializer
        if self.action == 'retrieve':
            return CotizacionDetailSerializer
        if self.action == 'datos_pdf':
            return CotizacionPDFSerializer
        return CotizacionListSerializer
    
    def perform_create(self, serializer):
        cotizacion = serializer.save(usuario=self.request.user)
        
        registrar_accion(
            usuario=self.request.user,
            accion='CREAR_COTIZACION',
            descripcion=f'Cotización creada: {cotizacion.contenedor} - {cotizacion.razon_social}',
            modelo='Cotizacion',
            objeto_id=cotizacion.id
        )
    
    @action(detail=True, methods=['get'])
    def datos_pdf(self, request, pk=None):
        """
        Obtener datos formateados para generar el PDF bilingüe.
        El frontend usa estos datos para renderizar el PDF con el diseño correcto.
        """
        cotizacion = self.get_object()
        serializer = CotizacionPDFSerializer(cotizacion)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def tipo_cambio(self, request):
        """
        Obtener tipo de cambio actual desde Banxico (API del Banco de México).
        Según documento: integración con API del banco central de México.
        """
        try:
            # API de Banxico para tipo de cambio
            # Nota: En producción necesitarás un token de Banxico
            # Por ahora retornamos un valor de ejemplo
            
            # URL de ejemplo de Banxico (requiere token)
            # url = "https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno"
            
            # Por ahora, valor aproximado
            tipo_cambio = Decimal('17.50')
            
            return Response({
                'tipo_cambio': float(tipo_cambio),
                'fecha': date.today().strftime('%d/%m/%Y'),
                'fuente': 'Banxico (valor aproximado)',
                'nota': 'Para producción, configurar token de API de Banxico'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener tipo de cambio: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
    
    @action(detail=True, methods=['post'])
    def duplicar(self, request, pk=None):
        """Duplicar una cotización existente"""
        cotizacion_original = self.get_object()
        
        # Crear copia
        cotizacion_nueva = Cotizacion.objects.create(
            usuario=request.user,
            razon_social=cotizacion_original.razon_social,
            referencia=f"{cotizacion_original.referencia} (copia)",
            fecha_emision=date.today(),
            bl_master=cotizacion_original.bl_master,
            contenedor=cotizacion_original.contenedor,
            puerto=cotizacion_original.puerto,
            terminal=cotizacion_original.terminal,
            naviera=cotizacion_original.naviera,
            eta=cotizacion_original.eta,
            fecha_entrega=cotizacion_original.fecha_entrega,
            dias_demoras=cotizacion_original.dias_demoras,
            dias_almacenaje=cotizacion_original.dias_almacenaje,
            divisa=cotizacion_original.divisa,
            costo_demoras=cotizacion_original.costo_demoras,
            costo_almacenaje=cotizacion_original.costo_almacenaje,
            costo_gastos_portuarios=cotizacion_original.costo_gastos_portuarios,
            costo_operativos=cotizacion_original.costo_operativos,
            costo_apoyo=cotizacion_original.costo_apoyo,
            costo_impuestos=cotizacion_original.costo_impuestos,
            costo_liberacion=cotizacion_original.costo_liberacion,
            costo_transporte=cotizacion_original.costo_transporte,
            tipo_cambio=cotizacion_original.tipo_cambio,
            observaciones=cotizacion_original.observaciones,
        )
        
        serializer = CotizacionDetailSerializer(cotizacion_nueva)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
