from django.urls import path
from .views import AnalyzeRouteView, GeocodeView, PresetsView

urlpatterns = [
    path("routes/analyze/", AnalyzeRouteView.as_view(), name="analyze-route"),
    path("geocode/", GeocodeView.as_view(), name="geocode"),
    path("presets/", PresetsView.as_view(), name="presets"),
]
