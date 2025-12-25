from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre', 'rol', 'rol_display',
            'activo', 'fecha_creacion', 'ultimo_acceso'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'ultimo_acceso']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre', 'rol', 'password', 'activo']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        usuario = Usuario(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(required=False)
    password_nuevo = serializers.CharField(min_length=6)
    
    def validate_password_actual(self, value):
        user = self.context['request'].user
        # Admin puede cambiar contraseñas sin verificar la actual
        if not user.es_admin and not user.check_password(value):
            raise serializers.ValidationError('Contraseña actual incorrecta')
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado para incluir datos del usuario en el token"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Datos adicionales en el token
        token['nombre'] = user.nombre
        token['rol'] = user.rol
        token['email'] = user.email
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        # Agregar datos del usuario en la respuesta
        data['usuario'] = {
            'id': self.user.id,
            'email': self.user.email,
            'nombre': self.user.nombre,
            'rol': self.user.rol,
            'rol_display': self.user.get_rol_display(),
        }
        return data
