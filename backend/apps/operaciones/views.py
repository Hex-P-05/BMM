from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Q
from datetime import date, timedelta

from .models import (
    Ticket, Contenedor, OperacionLogistica, OperacionRevalidacion,
    Clasificacion, Documento, Demora, Garantia, Prestamo
)
from .serializers import (
    TicketListSerializer, TicketDetailSerializer,
    TicketCreateSerializer, TicketUpdateSerializer,
    TicketEditarEtaSerializer,
    # Nuevos serializers
    ContenedorListSerializer, ContenedorDetailSerializer, ContenedorCreateSerializer,
    OperacionLogisticaListSerializer, OperacionLogisticaCreateSerializer,
    OperacionRevalidacionListSerializer, OperacionRevalidacionCreateSerializer,
    ClasificacionSerializer, DocumentoSerializer,
    DemoraSerializer, GarantiaSerializer, PrestamoSerializer
)
from apps.auditoria.utils import registrar_accion


# ============ CONTENEDOR VIEWSET ============

class ContenedorViewSet(viewsets.ModelViewSet):
    """
    API de Contenedores.

    Permisos:
    - Admin: Acceso total a todos los puertos
    - Clasificación: Puede crear contenedores (solo su puerto)
    - Otros roles: Solo lectura (filtrado por puerto asignado)
    """
    queryset = Contenedor.objects.select_related(
        'cliente', 'empresa', 'puerto', 'terminal', 'naviera',
        'ejecutivo_logistica', 'ejecutivo_revalidacion', 'creado_por'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estatus', 'empresa', 'puerto', 'cliente']
    search_fields = ['numero', 'bl_master']
    ordering_fields = ['fecha_creacion', 'eta']
    ordering = ['-fecha_creacion']

    def get_serializer_class(self):
        if self.action == 'create':
            return ContenedorCreateSerializer
        if self.action == 'retrieve':
            return ContenedorDetailSerializer
        return ContenedorListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Filtrar por puerto asignado (Admin y Pagos ven todos)
        queryset = user.filtrar_por_puerto(queryset, campo_puerto='puerto')

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

        if not user.puede_crear_contenedores:
            raise PermissionDenied('No tienes permiso para crear contenedores')

        contenedor = serializer.save(creado_por=user)

        registrar_accion(
            usuario=user,
            accion='CREAR_CONTENEDOR',
            descripcion=f'Contenedor creado: {contenedor.numero}',
            modelo='Contenedor',
            objeto_id=contenedor.id
        )

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de contenedores"""
        hoy = date.today()
        queryset = self.get_queryset()

        activos = queryset.filter(estatus='activo')

        total_activos = activos.count()
        alertas_preventivas = activos.filter(
            eta__lte=hoy + timedelta(days=21),
            eta__gte=hoy + timedelta(days=10)
        ).count()
        criticos = activos.filter(
            Q(eta__lt=hoy + timedelta(days=10)) | Q(eta__lt=hoy)
        ).count()

        por_estatus = queryset.values('estatus').annotate(
            cantidad=Count('id')
        )

        return Response({
            'kpis': {
                'contenedores_activos': total_activos,
                'alertas_preventivas': alertas_preventivas,
                'casos_criticos': criticos,
            },
            'por_estatus': list(por_estatus)
        })


# ============ OPERACION LOGISTICA VIEWSET ============

class OperacionLogisticaViewSet(viewsets.ModelViewSet):
    """
    Sábana de Logística - trabaja con TERMINALES, usa # CONTENEDOR como ID.

    Permisos:
    - Admin: Acceso total
    - Logística: CRUD (solo su puerto)
    - Pagos: Solo lectura (todos los puertos)
    - Revalidaciones/Clasificación: NO PUEDEN VER (403)
    """
    queryset = OperacionLogistica.objects.select_related(
        'contenedor', 'contenedor__cliente', 'contenedor__puerto',
        'ejecutivo', 'empresa', 'concepto', 'proveedor'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estatus', 'empresa', 'concepto', 'contenedor']
    search_fields = ['contenedor__numero', 'comentarios', 'pedimento']
    ordering_fields = ['fecha', 'fecha_creacion', 'importe']
    ordering = ['-fecha', '-id']

    def get_serializer_class(self):
        if self.action == 'create':
            return OperacionLogisticaCreateSerializer
        return OperacionLogisticaListSerializer

    def get_queryset(self):
        user = self.request.user

        # Verificar permiso de ver sábana de logística
        if not user.puede_ver_sabana_logistica:
            raise PermissionDenied('No tienes permiso para ver la sábana de logística')

        queryset = super().get_queryset()

        # Filtrar por puerto asignado
        queryset = user.filtrar_por_puerto(queryset, campo_puerto='contenedor__puerto')

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        if not user.puede_crear_operaciones_logistica:
            raise PermissionDenied('No tienes permiso para crear operaciones de logística')

        operacion = serializer.save(ejecutivo=user)

        registrar_accion(
            usuario=user,
            accion='CREAR_OPERACION_LOGISTICA',
            descripcion=f'Operación logística creada: {operacion.comentarios}',
            modelo='OperacionLogistica',
            objeto_id=operacion.id
        )

    @action(detail=False, methods=['get'])
    def siguiente_consecutivo(self, request):
        """Obtener el siguiente consecutivo para un prefijo"""
        prefijo = request.query_params.get('prefijo', '').upper()
        if not prefijo:
            return Response(
                {'error': 'Debe proporcionar un prefijo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        siguiente = OperacionLogistica.obtener_siguiente_consecutivo(prefijo)
        return Response({'prefijo': prefijo, 'siguiente_consecutivo': siguiente})


# ============ OPERACION REVALIDACION VIEWSET ============

class OperacionRevalidacionViewSet(viewsets.ModelViewSet):
    """
    Sábana de Revalidaciones - trabaja con NAVIERAS, usa BL como ID.

    Permisos:
    - Admin: Acceso total
    - Revalidaciones: CRUD (solo su puerto)
    - Logística/Pagos/Clasificación: NO PUEDEN VER (403)
    """
    queryset = OperacionRevalidacion.objects.select_related(
        'contenedor', 'contenedor__puerto',
        'ejecutivo', 'empresa', 'concepto', 'naviera_cuenta'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estatus', 'empresa', 'concepto', 'contenedor']
    search_fields = ['bl', 'contenedor__numero', 'referencia']
    ordering_fields = ['fecha', 'fecha_creacion', 'importe']
    ordering = ['-fecha', '-id']

    def get_serializer_class(self):
        if self.action == 'create':
            return OperacionRevalidacionCreateSerializer
        return OperacionRevalidacionListSerializer

    def get_queryset(self):
        user = self.request.user

        # Verificar permiso de ver sábana de revalidación
        if not user.puede_ver_sabana_revalidacion:
            raise PermissionDenied('No tienes permiso para ver la sábana de revalidaciones')

        queryset = super().get_queryset()

        # Filtrar por puerto asignado
        queryset = user.filtrar_por_puerto(queryset, campo_puerto='contenedor__puerto')

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        if not user.puede_crear_operaciones_revalidacion:
            raise PermissionDenied('No tienes permiso para crear operaciones de revalidación')

        operacion = serializer.save(ejecutivo=user)

        registrar_accion(
            usuario=user,
            accion='CREAR_OPERACION_REVALIDACION',
            descripcion=f'Operación revalidación creada: {operacion.referencia}',
            modelo='OperacionRevalidacion',
            objeto_id=operacion.id
        )

    @action(detail=False, methods=['get'])
    def siguiente_consecutivo(self, request):
        """Obtener el siguiente consecutivo para un prefijo"""
        prefijo = request.query_params.get('prefijo', '').upper()
        if not prefijo:
            return Response(
                {'error': 'Debe proporcionar un prefijo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        siguiente = OperacionRevalidacion.obtener_siguiente_consecutivo(prefijo)
        return Response({'prefijo': prefijo, 'siguiente_consecutivo': siguiente})


# ============ CLASIFICACION VIEWSET ============

class ClasificacionViewSet(viewsets.ModelViewSet):
    """
    Sábana de Clasificación - datos iniciales de mercancía.

    Permisos:
    - Admin: Acceso total + puede dar visto bueno
    - Clasificación: CRUD (solo su puerto)
    - Otros roles: NO PUEDEN VER (403)
    """
    queryset = Clasificacion.objects.select_related(
        'contenedor', 'contenedor__puerto',
        'clasificado_por', 'aprobado_por'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['visto_bueno_otorgado', 'requiere_visto_bueno', "bl"]
    search_fields = ['contenedor__numero', 'descripcion_mercancia']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        user = self.request.user

        # === INICIO DEL CAMBIO ===
        # Definimos si la petición es solo para "ver" (GET)
        es_lectura = self.action in ['list', 'retrieve']

        # Verificar permiso estricto (el original)
        if not user.puede_ver_sabana_clasificacion:
            # TRUCO: Si no tiene permiso, PERO solo quiere leer (para el autocompletado),
            # lo dejamos pasar. Si quiere editar/crear, ahí sí lo bloqueamos.
            if es_lectura:
                pass 
            else:
                raise PermissionDenied('No tienes permiso para modificar la sábana de clasificación')
        # === FIN DEL CAMBIO ===

        queryset = super().get_queryset()

        # Filtrar por puerto asignado
        # ESTO ES IMPORTANTE: Se mantiene el filtro por puerto, 
        # así que aunque puedan ver, solo verán lo de su puerto.
        queryset = user.filtrar_por_puerto(queryset, campo_puerto='contenedor__puerto')

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        if not user.puede_dar_alta_clasificacion:
            raise PermissionDenied('No tienes permiso para crear clasificaciones')

        clasificacion = serializer.save(clasificado_por=user)

        registrar_accion(
            usuario=user,
            accion='CREAR_CLASIFICACION',
            descripcion=f'Clasificación creada para: {clasificacion.contenedor.numero}',
            modelo='Clasificacion',
            objeto_id=clasificacion.id
        )

    @action(detail=True, methods=['post'])
    def dar_visto_bueno(self, request, pk=None):
        """Solo Admin puede dar visto bueno"""
        user = request.user

        if not user.puede_dar_visto_bueno:
            return Response(
                {'error': 'Solo el administrador puede dar visto bueno'},
                status=status.HTTP_403_FORBIDDEN
            )

        clasificacion = self.get_object()
        clasificacion.visto_bueno_otorgado = True
        clasificacion.aprobado_por = user
        from django.utils import timezone
        clasificacion.fecha_aprobacion = timezone.now()
        clasificacion.save()

        registrar_accion(
            usuario=user,
            accion='VISTO_BUENO_CLASIFICACION',
            descripcion=f'Visto bueno otorgado a: {clasificacion.contenedor.numero}',
            modelo='Clasificacion',
            objeto_id=clasificacion.id
        )

        return Response({'mensaje': 'Visto bueno otorgado correctamente'})


# ============ TICKET VIEWSET (LEGACY) ============

class TicketViewSet(viewsets.ModelViewSet):
    """
    API de Tickets/Contenedores - LEGACY.

    Permisos según documento:
    - Admin: Acceso total
    - Revalidaciones: Crear tickets, editar solo ETA y días libres (max 2 ediciones)
    - Pagos: Solo lectura

    NOTA: Este viewset se mantiene por compatibilidad.
    Usar ContenedorViewSet, OperacionLogisticaViewSet y OperacionRevalidacionViewSet
    para nuevas funcionalidades.
    """

    # En views.py, dentro de class TicketViewSet:

    def get_queryset(self):
        # 1. Obtenemos todos los tickets
        queryset = Ticket.objects.all() 
        
        # === AQUÍ ESTÁ EL TRUCO ===
        # Excluimos (escondemos) el concepto de "Apertura de Expediente" (ID 1)
        # para que no haga ruido en la sábana ni en el dashboard.
        queryset = queryset.exclude(concepto_id=1) 
        # ==========================
        
        # ... (aquí sigue el resto de tu lógica de filtros que ya tienes) ...
        # Por ejemplo:
        # user = self.request.user
        # if not user.es_admin and not user.es_pagos:
        #    ...
        
        return queryset
    pagination_class = None
    queryset = Ticket.objects.select_related(
        'ejecutivo', 'empresa', 'concepto', 'proveedor'
    ).all()
    permission_classes = [IsAuthenticated]
    #filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['estatus', 'empresa', 'concepto', 'ejecutivo', 'divisa']
    #search_fields = ['contenedor', 'bl_master', 'comentarios', 'pedimento']
    #ordering_fields = ['fecha_alta', 'eta', 'importe', 'fecha_creacion']
    #ordering = ['-fecha_alta']
    
    def get_queryset(self):
        return Ticket.objects.all()
    
    def list(self, request, *args, **kwargs):
        from apps.operaciones.models import Ticket
        from rest_framework import serializers

        class SimpleTicketSerializer(serializers.ModelSerializer):
            empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True, default='')
            ejecutivo_nombre = serializers.CharField(source='ejecutivo.nombre', read_only=True, default='')
            puerto_codigo = serializers.CharField(source='puerto.codigo', read_only=True, default='')
            semaforo = serializers.CharField(read_only=True)
            dias_restantes = serializers.IntegerField(read_only=True)
            estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
            comprobante_pago = serializers.FileField(read_only=True)

            class Meta:
                model = Ticket
                fields = [
                    'id', 'comentarios', 'importe', 'estatus', 'estatus_display', 'bl_master',
                    'contenedor', 'prefijo', 'consecutivo', 'fecha_alta',
                    'empresa', 'empresa_nombre', 'ejecutivo', 'ejecutivo_nombre',
                    'eta', 'dias_libres', 'divisa', 'pedimento', 'factura',
                    'semaforo', 'dias_restantes', 'observaciones',
                    'fecha_creacion', 'fecha_actualizacion', 'contador_ediciones',
                    'concepto', 'proveedor', 'fecha_pago',
                    'tipo_operacion', 'puerto', 'puerto_codigo',
                    'comprobante_pago'
                ]
        
        user = request.user
        tickets = Ticket.objects.select_related('ejecutivo', 'empresa', 'puerto').all()
        
        # Filtrar por tipo_operacion (query param)
        tipo = request.query_params.get('tipo_operacion')
        if tipo:
            tickets = tickets.filter(tipo_operacion=tipo)
        
        # Filtrar por puerto (query param)
        puerto_codigo = request.query_params.get('puerto')
        if puerto_codigo and puerto_codigo != 'todos':
            tickets = tickets.filter(puerto__codigo=puerto_codigo)
        
        # 1. Filtro por BL Master (Vital para la herencia)
        bl_master = request.query_params.get('bl_master')
        if bl_master:
            tickets = tickets.filter(bl_master__iexact=bl_master)

        # 2. Filtro por Contenedor (Vital para la herencia)
        contenedor = request.query_params.get('contenedor')
        if contenedor:
            tickets = tickets.filter(contenedor__iexact=contenedor)

        # 3. Ordenamiento (Para que 'ordering=-fecha_creacion' funcione)
        ordering = request.query_params.get('ordering')
        if ordering == '-fecha_creacion':
            tickets = tickets.order_by('-fecha_creacion')
        elif ordering:
            tickets = tickets.order_by(ordering)

        # Si el usuario tiene puerto asignado y no es admin/pagos, filtrar por su puerto
        # PERO: Si está buscando por BL o contenedor específico, no filtrar por puerto
        if not user.es_admin and not user.es_pagos and user.puerto_asignado:
            if not bl_master and not contenedor:  # Solo filtrar si NO está buscando específicamente
                tickets = tickets.filter(puerto=user.puerto_asignado)
        
        serializer = SimpleTicketSerializer(tickets, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = TicketDetailSerializer(instance)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = TicketUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
            
    def get_serializer_class(self):
        if self.action == 'create':
            return TicketCreateSerializer
        if self.action in ['update', 'partial_update']:
            return TicketUpdateSerializer
        if self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketListSerializer
    
    

    #def get_queryset(self):
    #    user = self.request.user
    #    queryset = super().get_queryset()
#
    #    # Filtros adicionales por query params
    #    semaforo = self.request.query_params.get('semaforo')
    #    if semaforo:
    #        hoy = date.today()
    #        if semaforo == 'verde':
    #            queryset = queryset.filter(eta__gt=hoy + timedelta(days=21))
    #        elif semaforo == 'amarillo':
    #            queryset = queryset.filter(
    #                eta__lte=hoy + timedelta(days=21),
    #                eta__gte=hoy + timedelta(days=10)
    #            )
    #        elif semaforo == 'rojo':
    #            queryset = queryset.filter(
    #                eta__lt=hoy + timedelta(days=10),
    #                eta__gte=hoy
    #            )
    #        elif semaforo == 'vencido':
    #            queryset = queryset.filter(eta__lt=hoy)
    #    print(f"DEBUG get_queryset: {queryset.count()} tickets")
    #    return queryset

    def perform_create(self, serializer):
        user = self.request.user

        # Verificar permiso de crear
        if not user.puede_crear_tickets:
            raise PermissionDenied('No tienes permiso para crear contenedores')

        ticket = serializer.save(ejecutivo=user)

        registrar_accion(
            usuario=user,
            accion='CREAR_CONTENEDOR',
            descripcion=f'Contenedor creado: {ticket.comentarios}',
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
