from django.contrib import admin
from .models import Bitacora


@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'usuario', 'accion', 'descripcion', 'modelo']
    list_filter = ['accion', 'modelo', 'fecha']
    search_fields = ['descripcion', 'usuario__nombre', 'usuario__email']
    readonly_fields = [
        'usuario', 'accion', 'descripcion', 'modelo', 'objeto_id',
        'datos_anteriores', 'datos_nuevos', 'ip_address', 'fecha'
    ]
    ordering = ['-fecha']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
