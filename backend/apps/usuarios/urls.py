from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('', include(router.urls)),
]
