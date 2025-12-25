from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmpresaViewSet, ConceptoViewSet, ProveedorViewSet,
    NavieraViewSet, PuertoViewSet, TerminalViewSet
)

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet, basename='empresa')
router.register(r'conceptos', ConceptoViewSet, basename='concepto')
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'navieras', NavieraViewSet, basename='naviera')
router.register(r'puertos', PuertoViewSet, basename='puerto')
router.register(r'terminales', TerminalViewSet, basename='terminal')

urlpatterns = [
    path('', include(router.urls)),
]
