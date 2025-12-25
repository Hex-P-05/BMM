from django.contrib import admin
from .models import Cotizacion


@admin.register(Cotizacion)
class CotizacionAdmin(admin.ModelAdmin):
    list_display = [
        'contenedor', 'razon_social', 'subtotal', 'divisa',
        'fecha_emision', 'usuario'
    ]
    list_filter = ['divisa', 'fecha_emision', 'usuario']
    search_fields = ['razon_social', 'contenedor', 'bl_master']
    readonly_fields = ['subtotal', 'fecha_creacion', 'fecha_actualizacion']
    date_hierarchy = 'fecha_emision'
    
    fieldsets = (
        ('Encabezado', {
            'fields': ('usuario', 'razon_social', 'referencia', 'fecha_emision')
        }),
        ('Datos Operativos', {
            'fields': (
                'bl_master', 'contenedor', 'puerto', 'terminal', 'naviera',
                'eta', 'fecha_entrega', 'dias_demoras', 'dias_almacenaje'
            )
        }),
        ('Costos', {
            'fields': (
                'divisa', 'tipo_cambio',
                'costo_demoras', 'costo_almacenaje', 'costo_gastos_portuarios',
                'costo_operativos', 'costo_apoyo', 'costo_impuestos',
                'costo_liberacion', 'costo_transporte', 'subtotal'
            )
        }),
        ('Extras', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )
