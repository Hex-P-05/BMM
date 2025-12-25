from django.contrib import admin
from .models import Pago, CierreOperacion


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = [
        'ticket', 'monto', 'fecha_pago', 'dias_retraso',
        'usuario', 'fecha_registro'
    ]
    list_filter = ['fecha_pago', 'usuario', 'ticket__empresa']
    search_fields = ['ticket__comentarios', 'ticket__contenedor', 'referencia']
    readonly_fields = ['dias_retraso', 'fecha_registro']
    date_hierarchy = 'fecha_pago'


@admin.register(CierreOperacion)
class CierreOperacionAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'monto_final', 'usuario', 'fecha_cierre']
    list_filter = ['fecha_cierre', 'usuario']
    search_fields = ['ticket__comentarios', 'ticket__contenedor']
    readonly_fields = ['fecha_cierre']
