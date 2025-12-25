from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'comentarios', 'empresa', 'ejecutivo', 'importe',
        'estatus', 'eta', 'semaforo', 'fecha_alta'
    ]
    list_filter = ['estatus', 'empresa', 'concepto', 'ejecutivo', 'divisa']
    search_fields = ['contenedor', 'bl_master', 'comentarios', 'pedimento']
    readonly_fields = ['comentarios', 'consecutivo', 'fecha_creacion', 'fecha_actualizacion']
    date_hierarchy = 'fecha_alta'
    ordering = ['-fecha_alta']
    
    fieldsets = (
        ('Identificación', {
            'fields': ('ejecutivo', 'empresa', 'fecha_alta')
        }),
        ('Datos de operación', {
            'fields': ('concepto', 'prefijo', 'consecutivo', 'contenedor', 'comentarios')
        }),
        ('Documentos', {
            'fields': ('bl_master', 'pedimento', 'factura')
        }),
        ('Proveedor y Pago', {
            'fields': ('proveedor', 'importe', 'divisa', 'estatus', 'fecha_pago')
        }),
        ('Control de tiempos', {
            'fields': ('eta', 'dias_libres', 'contador_ediciones')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Metadatos', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )
