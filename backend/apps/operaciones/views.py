from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Q
from datetime import date, timedelta

from .models import Ticket
from .serializers import (
    TicketListSerializer, TicketDetailSerializer,
    TicketCreateSerializer, TicketUpdateSerializer,
    TicketEditarEtaSerializer
)
from apps.auditoria.utils import registrar_accion


class TicketViewSet(viewsets.ModelViewSet):
    """
    API de Tickets/Operaciones.
    
    Permisos según documento:
    - Admin: Acceso total
    - Revalidaciones: Crear tickets, editar solo ETA y días libres (max 2 ediciones)
    - Pagos: Solo lectura
    """
    queryset = Ticket.objects.select_related(
        'ejecutivo', 'empresa', 'concepto', 'proveedor'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estatus', 'empresa', 'concepto', 'ejecutivo', 'divisa']
    search_fields = ['contenedor', 'bl_master', 'comentarios', 'pedimento']
    ordering_fields = ['fecha_alta', 'eta', 'importe', 'fecha_creacion']
    ordering = ['-fecha_alta']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TicketCreateSerializer
        if self.action in ['update', 'partial_update']:
            return TicketUpdateSerializer
        if self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketListSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Filtros adicionales por query params
        semaforo = self.request.query_params.get('semaforo')
        if semaforo:
            hoy = date.today()
            if semaforo == 'verde':
                queryset = queryset.filter(eta__gt=hoy + timedelta(days=21))
            elif semaforo == 'amarillo':
                queryset = queryset.filter(
                    eta__lte=hoy + timedelta(days=21),
                    eta__gte=hoy + timedelta(days=10)
                )
            elif semaforo == 'rojo':
                queryset = queryset.filter(
                    eta__lt=hoy + timedelta(days=10),
                    eta__gte=hoy
                )
            elif semaforo == 'vencido':
                queryset = queryset.filter(eta__lt=hoy)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Verificar permiso de crear
        if not user.puede_crear_tickets:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permiso para crear contenedores')
        
        ticket = serializer.save(ejecutivo=user)
        
        registrar_accion(
            usuario=user,
            accion='CREAR_TICKET',
            descripcion=f'Ticket creado: {ticket.comentarios}',
            modelo='Ticket',
            objeto_id=ticket.id
        )
    
    def perform_update(self, serializer):
        user = self.request.user
        ticket = self.get_object()
        datos_anteriores = {
            'eta': str(ticket.eta) if ticket.eta else None,
            'dias_libres': ticket.dias_libres,
            'importe': str(ticket.importe)
        }
        
        # Si es ejecutivo, incrementar contador de ediciones
        if user.es_ejecutivo:
            serializer.save(contador_ediciones=ticket.contador_ediciones + 1)
        else:
            serializer.save()
        
        ticket.refresh_from_db()
        datos_nuevos = {
            'eta': str(ticket.eta) if ticket.eta else None,
            'dias_libres': ticket.dias_libres,
            'importe': str(ticket.importe)
        }
        
        registrar_accion(
            usuario=user,
            accion='EDITAR_TICKET',
            descripcion=f'Ticket editado: {ticket.comentarios}',
            modelo='Ticket',
            objeto_id=ticket.id,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos
        )
    
    @action(detail=True, methods=['post'])
    def editar_eta(self, request, pk=None):
        """
        Endpoint específico para que Revalidaciones edite ETA y días libres.
        Respeta el límite de 2 ediciones.
        """
        ticket = self.get_object()
        user = request.user
        
        # Verificar permisos
        if user.es_pagos:
            return Response(
                {'error': 'No tienes permiso para editar contenedores'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verificar límite de ediciones para ejecutivos
        if user.es_ejecutivo and not ticket.puede_ser_editado_por_ejecutivo:
            return Response(
                {'error': 'Has alcanzado el límite de 2 ediciones. Contacta al administrador.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TicketEditarEtaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        datos_anteriores = {
            'eta': str(ticket.eta) if ticket.eta else None,
            'dias_libres': ticket.dias_libres
        }
        
        # Actualizar campos
        if 'eta' in serializer.validated_data:
            ticket.eta = serializer.validated_data['eta']
        if 'dias_libres' in serializer.validated_data:
            ticket.dias_libres = serializer.validated_data['dias_libres']
        
        # Incrementar contador solo para ejecutivos
        if user.es_ejecutivo:
            ticket.contador_ediciones += 1
        
        ticket.save()
        
        datos_nuevos = {
            'eta': str(ticket.eta) if ticket.eta else None,
            'dias_libres': ticket.dias_libres
        }
        
        registrar_accion(
            usuario=user,
            accion='EDITAR_ETA',
            descripcion=f'ETA/Días libres editados en: {ticket.comentarios}',
            modelo='Ticket',
            objeto_id=ticket.id,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos
        )
        
        return Response({
            'mensaje': 'ETA actualizado correctamente',
            'ediciones_restantes': 2 - ticket.contador_ediciones if user.es_ejecutivo else 'ilimitadas'
        })
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Datos para el dashboard según documento:
        - Contenedores activos
        - Alertas preventivas (amarillo)
        - Casos críticos/vencidos (rojo)
        - Monto total por cobrar
        """
        hoy = date.today()
        queryset = self.get_queryset()
        
        # Filtrar solo pendientes para KPIs
        pendientes = queryset.filter(estatus='pendiente')
        
        # Contadores
        total_activos = pendientes.count()
        
        alertas_preventivas = pendientes.filter(
            eta__lte=hoy + timedelta(days=21),
            eta__gte=hoy + timedelta(days=10)
        ).count()
        
        criticos = pendientes.filter(
            Q(eta__lt=hoy + timedelta(days=10)) | Q(eta__lt=hoy)
        ).count()
        
        monto_por_cobrar = pendientes.aggregate(
            total=Sum('importe')
        )['total'] or 0
        
        # Por estatus
        por_estatus = queryset.values('estatus').annotate(
            cantidad=Count('id'),
            monto=Sum('importe')
        )
        
        # Por empresa
        por_empresa = queryset.filter(estatus='pendiente').values(
            'empresa__nombre'
        ).annotate(
            cantidad=Count('id'),
            monto=Sum('importe')
        ).order_by('-monto')[:10]
        
        return Response({
            'kpis': {
                'contenedores_activos': total_activos,
                'alertas_preventivas': alertas_preventivas,
                'casos_criticos': criticos,
                'monto_por_cobrar': float(monto_por_cobrar)
            },
            'por_estatus': list(por_estatus),
            'por_empresa': list(por_empresa)
        })
    
    @action(detail=False, methods=['get'])
    def siguiente_consecutivo(self, request):
        """Obtener el siguiente consecutivo para un prefijo"""
        prefijo = request.query_params.get('prefijo', '').upper()
        if not prefijo:
            return Response(
                {'error': 'Debe proporcionar un prefijo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        siguiente = Ticket.obtener_siguiente_consecutivo(prefijo)
        return Response({'prefijo': prefijo, 'siguiente_consecutivo': siguiente})
