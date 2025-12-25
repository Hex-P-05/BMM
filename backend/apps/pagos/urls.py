from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PagoViewSet, CierreOperacionViewSet

router = DefaultRouter()
router.register(r'registros', PagoViewSet, basename='pago')
router.register(r'cierres', CierreOperacionViewSet, basename='cierre')

urlpatterns = [
    path('', include(router.urls)),
]
