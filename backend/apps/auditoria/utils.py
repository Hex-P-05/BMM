from .models import Bitacora


def registrar_accion(usuario, accion, descripcion, modelo='', objeto_id=None, 
                     datos_anteriores=None, datos_nuevos=None, ip_address=None):
    """
    Función helper para registrar acciones en la bitácora.
    
    Uso:
        registrar_accion(
            usuario=request.user,
            accion='EDITAR_ETA',
            descripcion='Cambió ETA de 2024-01-15 a 2024-01-20',
            modelo='Ticket',
            objeto_id=ticket.id,
            datos_anteriores={'eta': '2024-01-15'},
            datos_nuevos={'eta': '2024-01-20'}
        )
    """
    return Bitacora.objects.create(
        usuario=usuario,
        accion=accion,
        descripcion=descripcion,
        modelo=modelo,
        objeto_id=objeto_id,
        datos_anteriores=datos_anteriores,
        datos_nuevos=datos_nuevos,
        ip_address=ip_address
    )


def get_client_ip(request):
    """Obtener IP del cliente desde el request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
