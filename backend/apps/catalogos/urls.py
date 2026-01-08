from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmpresaViewSet, ConceptoViewSet, ProveedorViewSet,
    NavieraViewSet, PuertoViewSet, TerminalViewSet,
    ClienteViewSet, AgenteAduanalViewSet
)

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet, basename='empresa')
router.register(r'conceptos', ConceptoViewSet, basename='concepto')
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'navieras', NavieraViewSet, basename='naviera')
router.register(r'puertos', PuertoViewSet, basename='puerto')
router.register(r'terminales', TerminalViewSet, basename='terminal')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'agentes', AgenteAduanalViewSet, basename='agente')

urlpatterns = [
    path('', include(router.urls)),
]
