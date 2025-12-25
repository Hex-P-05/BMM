from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Autenticación JWT
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # APIs de la aplicación
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/catalogos/', include('apps.catalogos.urls')),
    path('api/operaciones/', include('apps.operaciones.urls')),
    path('api/pagos/', include('apps.pagos.urls')),
    path('api/cotizaciones/', include('apps.cotizaciones.urls')),
    path('api/auditoria/', include('apps.auditoria.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
