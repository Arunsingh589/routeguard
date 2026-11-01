import requests
from typing import List, Dict, Any, Optional

POPULAR_HUBS = [
    {"city": "Chicago", "state": "IL", "lat": 41.8781, "lon": -87.6298, "label": "Chicago, IL (Midwest Hub)"},
    {"city": "Dallas", "state": "TX", "lat": 32.7767, "lon": -96.7970, "label": "Dallas, TX (South Central Hub)"},
    {"city": "Denver", "state": "CO", "lat": 39.7392, "lon": -104.9903, "label": "Denver, CO (Mountain Hub)"},
    {"city": "Seattle", "state": "WA", "lat": 47.6062, "lon": -122.3321, "label": "Seattle, WA (Pacific NW Hub)"},
    {"city": "Atlanta", "state": "GA", "lat": 33.7490, "lon": -84.3880, "label": "Atlanta, GA (Southeast Hub)"},
    {"city": "New York", "state": "NY", "lat": 40.7128, "lon": -74.0060, "label": "New York, NY (Northeast Gateway)"},
    {"city": "Los Angeles", "state": "CA", "lat": 34.0522, "lon": -118.2437, "label": "Los Angeles, CA (Port of LA Hub)"},
    {"city": "Phoenix", "state": "AZ", "lat": 33.4484, "lon": -112.0740, "label": "Phoenix, AZ (Southwest Hub)"},
    {"city": "Minneapolis", "state": "MN", "lat": 44.9778, "lon": -93.2650, "label": "Minneapolis, MN (Upper Midwest Hub)"},
    {"city": "Kansas City", "state": "MO", "lat": 39.0997, "lon": -94.5786, "label": "Kansas City, MO (Central Freight Core)"},
    {"city": "Salt Lake City", "state": "UT", "lat": 40.7608, "lon": -111.8910, "label": "Salt Lake City, UT (Intermountain Hub)"},
    {"city": "Memphis", "state": "TN", "lat": 35.1495, "lon": -90.0490, "label": "Memphis, TN (Logistics Capital)"},
    {"city": "Miami", "state": "FL", "lat": 25.7617, "lon": -80.1918, "label": "Miami, FL (Atlantic Terminal)"},
]

def search_locations(query: str) -> List[Dict[str, Any]]:
    clean_query = query.strip()
    if not clean_query:
        return POPULAR_HUBS[:6]

    matching_hubs = [
        hub for hub in POPULAR_HUBS
        if clean_query.lower() in hub["label"].lower() or clean_query.lower() in hub["city"].lower()
    ]

    try:
        url = "https://photon.komoot.io/api/"
        params = {"q": clean_query, "limit": 6}
        headers = {"User-Agent": "RouteGuard-TruckRouting/1.0"}
        response = requests.get(url, params=params, headers=headers, timeout=4)
        if response.status_code == 200:
            data = response.json()
            features = data.get("features", [])
            results = []
            for item in features:
                coords = item.get("geometry", {}).get("coordinates", [])
                props = item.get("properties", {})
                if len(coords) >= 2:
                    lon, lat = coords[0], coords[1]
                    name = props.get("name", "")
                    city = props.get("city", props.get("county", ""))
                    state = props.get("state", "")
                    country = props.get("country", "")
                    parts = [p for p in [name, city, state, country] if p]
                    label = ", ".join(parts[:3]) or clean_query
                    results.append({
                        "city": name or city,
                        "state": state,
                        "lat": lat,
                        "lon": lon,
                        "label": label,
                    })
            if results:
                combined = matching_hubs + [r for r in results if not any(abs(r["lat"] - h["lat"]) < 0.1 and abs(r["lon"] - h["lon"]) < 0.1 for h in matching_hubs)]
                return combined[:8]
    except Exception:
        pass

    return matching_hubs or POPULAR_HUBS[:6]
