from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone

from .models import Usuario
from .serializers import (
    UsuarioSerializer, 
    UsuarioCreateSerializer,
    CambiarPasswordSerializer,
    CustomTokenObtainPairSerializer
)
from apps.auditoria.utils import registrar_accion


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada de login que registra el acceso"""
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            email = request.data.get('email')
            try:
                usuario = Usuario.objects.get(email=email)
                usuario.ultimo_acceso = timezone.now()
                usuario.save(update_fields=['ultimo_acceso'])
                registrar_accion(
                    usuario=usuario,
                    accion='LOGIN',
                    descripcion=f'Inicio de sesión exitoso'
                )
            except Usuario.DoesNotExist:
                pass
        return response


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    API de usuarios - Solo Admin puede gestionar usuarios
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.es_admin:
            return Usuario.objects.all()
        return Usuario.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        usuario = serializer.save()
        registrar_accion(
            usuario=self.request.user,
            accion='CREAR_USUARIO',
            descripcion=f'Usuario creado: {usuario.email}',
            modelo='Usuario',
            objeto_id=usuario.id
        )
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener datos del usuario actual"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cambiar_password(self, request, pk=None):
        """Cambiar contraseña de un usuario"""
        usuario = self.get_object()
        serializer = CambiarPasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            usuario.set_password(serializer.validated_data['password_nuevo'])
            usuario.save()
            registrar_accion(
                usuario=request.user,
                accion='CAMBIAR_PASSWORD',
                descripcion=f'Contraseña cambiada para: {usuario.email}',
                modelo='Usuario',
                objeto_id=usuario.id
            )
            return Response({'mensaje': 'Contraseña actualizada correctamente'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def toggle_activo(self, request, pk=None):
        """Activar/desactivar usuario"""
        usuario = self.get_object()
        usuario.activo = not usuario.activo
        usuario.save()
        estado = 'activado' if usuario.activo else 'desactivado'
        registrar_accion(
            usuario=request.user,
            accion='TOGGLE_USUARIO',
            descripcion=f'Usuario {estado}: {usuario.email}',
            modelo='Usuario',
            objeto_id=usuario.id
        )
        return Response({
            'mensaje': f'Usuario {estado}',
            'activo': usuario.activo
        })
