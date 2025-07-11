# nlp_summarizer/urls.py

from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from summarizer_app import views # Import your views module

urlpatterns = [
    path('admin/', admin.site.urls),
    # Map the root URL ('') to your homepage_view
    path('', views.homepage_view, name='homepage'), # This will serve your index.html
    # This is the crucial line: Map the API endpoint to '/api/summarize/'
    path('api/summarize/', views.summarize_text, name='api_summarize') 
]

# This is essential for serving static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)