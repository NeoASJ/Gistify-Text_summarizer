# nlp_summarizer/urls.py

from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from summarizer_app import views # Import your views module

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.homepage_view, name='homepage'),  # All handled here
]

# This is essential for serving static files in development
