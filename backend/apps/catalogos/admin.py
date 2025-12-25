from django.contrib import admin
from .models import Empresa, Concepto, Proveedor, Naviera, Puerto, Terminal


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'razon_social', 'rfc', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre', 'razon_social', 'rfc']


@admin.register(Concepto)
class ConceptoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre']


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'banco', 'cuenta', 'activo']
    list_filter = ['activo', 'banco']
    search_fields = ['nombre', 'cuenta', 'clabe']


@admin.register(Naviera)
class NavieraAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre', 'codigo']


@admin.register(Puerto)
class PuertoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre']


@admin.register(Terminal)
class TerminalAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'puerto', 'activo']
    list_filter = ['activo', 'puerto']
    search_fields = ['nombre']
