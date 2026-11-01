from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.geocoding import search_locations, POPULAR_HUBS
from .services.router import generate_three_routes

class GeocodeView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "")
        results = search_locations(query)
        return Response({"results": results})

class PresetsView(APIView):
    def get(self, request):
        presets = [
            {
                "id": "preset_chicago_dallas",
                "name": "Chicago to Dallas (Corridor 35)",
                "description": "High-volume midwest freight corridor crossing Midwest wind plains.",
                "origin": {"city": "Chicago", "state": "IL", "lat": 41.8781, "lon": -87.6298, "label": "Chicago, IL"},
                "destination": {"city": "Dallas", "state": "TX", "lat": 32.7767, "lon": -96.7970, "label": "Dallas, TX"},
                "suggested_load_weight": 35000,
                "default_interval": 25,
            },
            {
                "id": "preset_denver_seattle",
                "name": "Denver to Seattle (Mountain Corridor)",
                "description": "Challenging Rocky Mountain passage prone to heavy snowfall and gusty passes.",
                "origin": {"city": "Denver", "state": "CO", "lat": 39.7392, "lon": -104.9903, "label": "Denver, CO"},
                "destination": {"city": "Seattle", "state": "WA", "lat": 47.6062, "lon": -122.3321, "label": "Seattle, WA"},
                "suggested_load_weight": 42000,
                "default_interval": 25,
            },
            {
                "id": "preset_atlanta_nyc",
                "name": "Atlanta to New York (I-85 / I-95)",
                "description": "Heavy Atlantic coastal corridor with frequent rain fronts and tropical depressions.",
                "origin": {"city": "Atlanta", "state": "GA", "lat": 33.7490, "lon": -84.3880, "label": "Atlanta, GA"},
                "destination": {"city": "New York", "state": "NY", "lat": 40.7128, "lon": -74.0060, "label": "New York, NY"},
                "suggested_load_weight": 28000,
                "default_interval": 25,
            },
            {
                "id": "preset_la_phoenix",
                "name": "Los Angeles to Phoenix (I-10 Desert)",
                "description": "Desert corridor prone to severe crosswinds and sudden dust squalls.",
                "origin": {"city": "Los Angeles", "state": "CA", "lat": 34.0522, "lon": -118.2437, "label": "Los Angeles, CA"},
                "destination": {"city": "Phoenix", "state": "AZ", "lat": 33.4484, "lon": -112.0740, "label": "Phoenix, AZ"},
                "suggested_load_weight": 45000,
                "default_interval": 25,
            },
            {
                "id": "preset_minneapolis_kc",
                "name": "Minneapolis to Kansas City (I-35 North-South)",
                "description": "Upper Great Plains corridor exposed to winter blizzards and rapid temp drops.",
                "origin": {"city": "Minneapolis", "state": "MN", "lat": 44.9778, "lon": -93.2650, "label": "Minneapolis, MN"},
                "destination": {"city": "Kansas City", "state": "MO", "lat": 39.0997, "lon": -94.5786, "label": "Kansas City, MO"},
                "suggested_load_weight": 32000,
                "default_interval": 10,
            },
        ]
        return Response({"presets": presets, "hubs": POPULAR_HUBS})

class AnalyzeRouteView(APIView):
    def post(self, request):
        data = request.data
        origin = data.get("origin")
        destination = data.get("destination")

        if not origin or not destination:
            return Response(
                {"error": "Both origin and destination coordinates are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "lat" not in origin or "lon" not in origin or "lat" not in destination or "lon" not in destination:
            return Response(
                {"error": "Origin and destination must include 'lat' and 'lon'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dep_str = data.get("departure_time")
        if dep_str:
            try:
                departure_dt = datetime.fromisoformat(dep_str.replace("Z", "+00:00"))
            except Exception:
                departure_dt = datetime.now(timezone.utc)
        else:
            departure_dt = datetime.now(timezone.utc)

        try:
            load_weight = float(data.get("load_weight_lbs", 35000))
        except (ValueError, TypeError):
            load_weight = 35000.0

        try:
            sampling_interval = float(data.get("sampling_interval_miles", 25.0))
            if sampling_interval not in [10.0, 25.0, 50.0]:
                sampling_interval = 25.0
        except (ValueError, TypeError):
            sampling_interval = 25.0

        try:
            result = generate_three_routes(
                origin=origin,
                destination=destination,
                departure_time=departure_dt,
                load_weight_lbs=load_weight,
                sampling_interval_miles=sampling_interval,
            )
            return Response(result)
        except Exception as e:
            return Response(
                {"error": f"Failed to generate route analysis: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
