from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TicketViewSet,
    ContenedorViewSet,
    OperacionLogisticaViewSet,
    OperacionRevalidacionViewSet,
    ClasificacionViewSet
)

router = DefaultRouter()

# Endpoints principales (nuevos)
router.register(r'contenedores', ContenedorViewSet, basename='contenedor')
router.register(r'logistica', OperacionLogisticaViewSet, basename='operacion-logistica')
router.register(r'revalidaciones', OperacionRevalidacionViewSet, basename='operacion-revalidacion')
router.register(r'clasificaciones', ClasificacionViewSet, basename='clasificacion')

# Endpoint legacy (mantener para compatibilidad)
router.register(r'tickets', TicketViewSet, basename='ticket')

urlpatterns = [
    path('', include(router.urls)),
]
