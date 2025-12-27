from django.contrib import admin
from .models import (
    Pago, PagoLogistica, PagoRevalidacion,
    CierreOperacion, CierreLegacy
)


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tipo_operacion', 'monto', 'fecha_pago', 'dias_retraso',
        'usuario', 'fecha_registro'
    ]
    list_filter = ['fecha_pago', 'tipo_operacion', 'usuario']
    search_fields = ['concepto_pago', 'referencia', 'observaciones']
    readonly_fields = ['dias_retraso', 'fecha_registro']
    date_hierarchy = 'fecha_pago'


@admin.register(PagoLogistica)
class PagoLogisticaAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'operacion', 'monto', 'fecha_pago',
        'usuario', 'fecha_registro'
    ]
    list_filter = ['fecha_pago', 'usuario']
    search_fields = ['operacion__comentarios', 'referencia_bancaria', 'observaciones']
    readonly_fields = ['fecha_registro']
    date_hierarchy = 'fecha_pago'
    raw_id_fields = ['operacion']


@admin.register(PagoRevalidacion)
class PagoRevalidacionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'operacion', 'tipo_pago', 'monto', 'fecha_pago',
        'usuario', 'fecha_registro'
    ]
    list_filter = ['fecha_pago', 'tipo_pago', 'usuario']
    search_fields = ['operacion__comentarios', 'referencia_bancaria', 'observaciones']
    readonly_fields = ['fecha_registro']
    date_hierarchy = 'fecha_pago'
    raw_id_fields = ['operacion']


@admin.register(CierreOperacion)
class CierreOperacionAdmin(admin.ModelAdmin):
    list_display = ['id', 'contenedor', 'monto_final', 'garantias_verificadas', 'usuario', 'fecha_cierre']
    list_filter = ['fecha_cierre', 'garantias_verificadas', 'usuario']
    search_fields = ['contenedor__numero', 'observaciones']
    readonly_fields = ['fecha_cierre']
    raw_id_fields = ['contenedor']


@admin.register(CierreLegacy)
class CierreLegacyAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'monto_final', 'usuario', 'fecha_cierre']
    list_filter = ['fecha_cierre', 'usuario']
    search_fields = ['ticket__comentarios', 'ticket__contenedor', 'observaciones']
    readonly_fields = ['fecha_cierre']
    raw_id_fields = ['ticket']