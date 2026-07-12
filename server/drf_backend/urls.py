"""
URL configuration for drf_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from accounts.views import VerifiedTokenObtainPairView, VerifiedTokenRefreshView
from drf_backend.health import health, readiness

urlpatterns = [
    path('health/', health, name='health'),
    path('ready/', readiness, name='readiness'),
    path('admin/', admin.site.urls),
    # basic root route so visiting http://127.0.0.1:8000/ doesn't 404
    path('', lambda request: JsonResponse({
        'message': 'drf_backend: API running',
        'routes': {
            'admin': '/admin/',
            'token_obtain': '/api/token/',
            'token_refresh': '/api/token/refresh/',
            'auth': '/api/auth/'
        }
    })),
    
    # jwt urls
    path('api/token/', VerifiedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', VerifiedTokenRefreshView.as_view(), name='token_refresh'),

    # auth urls
    path('api/auth/', include('accounts.urls')),

    # project urls
    path('api/projects/', include('projects.urls')),
    
	# interactions urls
	path('api/interactions/', include('interactions.urls')),

	# in-app notifications
	path('api/notifications/', include('notifications.urls')),

	# abuse reports and staff moderation queue
	path('api/moderation/', include('moderation.urls')),
]
