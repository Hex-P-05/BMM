from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Bitacora
from .serializers import BitacoraSerializer


class BitacoraViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API de bitácora - Solo lectura, solo Admin puede ver
    """
    queryset = Bitacora.objects.select_related('usuario').all()
    serializer_class = BitacoraSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['accion', 'usuario', 'modelo']
    search_fields = ['descripcion', 'usuario__nombre']
    ordering_fields = ['fecha', 'accion']
    ordering = ['-fecha']
    
    def get_queryset(self):
        user = self.request.user
        if not user.es_admin:
            # Solo admin puede ver toda la bitácora
            return Bitacora.objects.none()
        return super().get_queryset()
