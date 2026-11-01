import math
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from .weather import fetch_weather_for_checkpoints, fetch_corridor_forecast_matrix
from .risk_calculator import evaluate_checkpoint_risk, RISK_ORDER
from .recommender import rank_routes

EARTH_RADIUS_MILES = 3958.8
METERS_TO_MILES = 0.000621371

def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2) + (
        math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_MILES * c

def interpolate_point(lat1: float, lon1: float, lat2: float, lon2: float, fraction: float) -> Tuple[float, float]:
    return (
        lat1 + (lat2 - lat1) * fraction,
        lon1 + (lon2 - lon1) * fraction,
    )

def fetch_osrm_route(coords_str: str) -> List[Dict[str, Any]]:
    url = f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson&alternatives=3&steps=false"
    try:
        resp = requests.get(url, timeout=7)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok":
                return data.get("routes", [])
    except Exception:
        pass
    return []

def generate_fallback_geometry(start_lat: float, start_lon: float, end_lat: float, end_lon: float, curve_factor: float) -> List[List[float]]:
    coords = []
    num_points = 50
    mid_lat = (start_lat + end_lat) / 2.0
    mid_lon = (start_lon + end_lon) / 2.0
    dx = end_lon - start_lon
    dy = end_lat - start_lat
    perp_dx = -dy * curve_factor
    perp_dy = dx * curve_factor

    for i in range(num_points + 1):
        t = i / float(num_points)
        arc = math.sin(t * math.pi)
        lat = start_lat + t * dy + arc * perp_dy
        lon = start_lon + t * dx + arc * perp_dx
        coords.append([round(lon, 5), round(lat, 5)])
    return coords

def sample_checkpoints(coordinates: List[List[float]], interval_miles: float, total_distance_miles: float, total_duration_seconds: float, departure_time: datetime) -> List[Dict[str, Any]]:
    if not coordinates:
        return []

    cumulative_distances = [0.0]
    for i in range(1, len(coordinates)):
        prev_lon, prev_lat = coordinates[i - 1]
        curr_lon, curr_lat = coordinates[i]
        d = haversine_miles(prev_lat, prev_lon, curr_lat, curr_lon)
        cumulative_distances.append(cumulative_distances[-1] + d)

    actual_total_miles = cumulative_distances[-1] or total_distance_miles or 1.0

    target_distances = []
    curr_target = 0.0
    while curr_target < actual_total_miles:
        target_distances.append(curr_target)
        curr_target += interval_miles

    if not target_distances or (actual_total_miles - target_distances[-1] > 2.0):
        target_distances.append(actual_total_miles)

    checkpoints = []
    coord_idx = 0

    for target_dist in target_distances:
        while coord_idx < len(cumulative_distances) - 1 and cumulative_distances[coord_idx + 1] < target_dist:
            coord_idx += 1

        if coord_idx >= len(coordinates) - 1:
            lat, lon = coordinates[-1][1], coordinates[-1][0]
        else:
            d_start = cumulative_distances[coord_idx]
            d_end = cumulative_distances[coord_idx + 1]
            seg_len = d_end - d_start
            fraction = (target_dist - d_start) / seg_len if seg_len > 0.0 else 0.0
            lat, lon = interpolate_point(
                coordinates[coord_idx][1], coordinates[coord_idx][0],
                coordinates[coord_idx + 1][1], coordinates[coord_idx + 1][0],
                fraction,
            )

        fraction_of_trip = target_dist / actual_total_miles if actual_total_miles > 0 else 0.0
        elapsed_seconds = total_duration_seconds * fraction_of_trip
        eta = departure_time + timedelta(seconds=elapsed_seconds)

        checkpoints.append({
            "index": len(checkpoints),
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "distance_from_start_miles": round(target_dist, 1),
            "eta": eta.isoformat(),
            "eta_formatted": eta.strftime("%b %d, %I:%M %p"),
        })

    return checkpoints

def calculate_route_risk_profile(
    checkpoints_with_weather: List[Dict[str, Any]],
    load_weight_lbs: float,
    total_distance_miles: float,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    enriched_checkpoints = []
    num_pts = len(checkpoints_with_weather)

    # Compute segment distance represented by each checkpoint
    segment_lengths = []
    if num_pts <= 1:
        segment_lengths = [total_distance_miles]
    else:
        dists = [
            cp.get("distance_from_start_miles", i * (total_distance_miles / max(1, num_pts - 1)))
            for i, cp in enumerate(checkpoints_with_weather)
        ]
        for i in range(num_pts):
            if i == 0:
                seg = (dists[1] - dists[0]) / 2.0
            elif i == num_pts - 1:
                seg = (dists[num_pts - 1] - dists[num_pts - 2]) / 2.0
            else:
                seg = (dists[i + 1] - dists[i - 1]) / 2.0
            segment_lengths.append(max(0.1, seg))

        # Scale so exact sum equals total_distance_miles
        total_segs = sum(segment_lengths)
        if total_segs > 0:
            scale = total_distance_miles / total_segs
            segment_lengths = [round(s * scale, 2) for s in segment_lengths]

    counts = {"Low": 0.0, "Moderate": 0.0, "High": 0.0, "Severe": 0.0, "No Travel": 0.0}
    applied_rules = set()
    total_numeric = 0.0

    for idx, cp in enumerate(checkpoints_with_weather):
        w_eval = evaluate_checkpoint_risk(
            wind_mph=cp["wind_mph"],
            rain_in_hr=cp["rain_in_hr"],
            snow_in_hr=cp["snow_in_hr"],
            load_weight_lbs=load_weight_lbs,
        )
        seg_dist = segment_lengths[idx] if idx < len(segment_lengths) else (total_distance_miles / max(1, num_pts))
        combined = {**cp, **w_eval, "segment_miles": seg_dist}
        enriched_checkpoints.append(combined)

        level = combined["final_risk"]
        counts[level] = counts.get(level, 0.0) + seg_dist
        total_numeric += combined["numeric_risk"]

        if combined["applied_rule"]:
            applied_rules.add(combined["applied_rule"])

    avg_risk = total_numeric / float(num_pts) if num_pts > 0 else 1.0

    stats = {
        "low_miles": round(counts["Low"], 1),
        "moderate_miles": round(counts["Moderate"], 1),
        "high_miles": round(counts["High"], 1),
        "severe_miles": round(counts["Severe"], 1),
        "no_travel_miles": round(counts["No Travel"], 1),
        "average_risk": round(avg_risk, 2),
        "applied_rules": list(applied_rules),
        "is_safe_for_travel": counts["No Travel"] == 0.0,
    }

    return enriched_checkpoints, stats

def generate_three_routes(
    origin: Dict[str, Any],
    destination: Dict[str, Any],
    departure_time: datetime,
    load_weight_lbs: float,
    sampling_interval_miles: float = 25.0,
) -> Dict[str, Any]:
    start_lon, start_lat = origin["lon"], origin["lat"]
    end_lon, end_lat = destination["lon"], destination["lat"]

    coords_direct = f"{start_lon:.5f},{start_lat:.5f};{end_lon:.5f},{end_lat:.5f}"
    raw_osrm_routes = fetch_osrm_route(coords_direct)

    default_names = [
        "Primary Interstate Highway",
        "Northern Bypass Corridor",
        "Southern Commercial Transit",
    ]

    built_routes_raw = []
    if raw_osrm_routes:
        for idx, r in enumerate(raw_osrm_routes[:3]):
            name = default_names[idx] if idx < len(default_names) else f"Highway Option {idx + 1}"
            built_routes_raw.append({
                "name": name,
                "geometry": r["geometry"]["coordinates"],
                "distance_miles": r["distance"] * METERS_TO_MILES,
                "duration_seconds": r["duration"],
            })

    if len(built_routes_raw) < 3:
        curve_offsets = [0.12, -0.12, 0.22, -0.22]
        for factor in curve_offsets:
            if len(built_routes_raw) >= 3:
                break
            mid_lat = (start_lat + end_lat) / 2.0 + (-(end_lon - start_lon) * factor * 0.4)
            mid_lon = (start_lon + end_lon) / 2.0 + ((end_lat - start_lat) * factor * 0.4)
            via_coords = f"{start_lon:.5f},{start_lat:.5f};{mid_lon:.5f},{mid_lat:.5f};{end_lon:.5f},{end_lat:.5f}"
            via_routes = fetch_osrm_route(via_coords)
            if via_routes:
                r = via_routes[0]
                idx = len(built_routes_raw)
                name = default_names[idx] if idx < len(default_names) else f"Alternate Route {idx + 1}"
                built_routes_raw.append({
                    "name": name,
                    "geometry": r["geometry"]["coordinates"],
                    "distance_miles": r["distance"] * METERS_TO_MILES,
                    "duration_seconds": r["duration"],
                })

    if len(built_routes_raw) < 3:
        straight_dist = haversine_miles(start_lat, start_lon, end_lat, end_lon)
        curves = [0.0, 0.15, -0.15]
        labels = ["Primary Interstate Highway", "Northern Bypass Corridor", "Southern Commercial Transit"]
        for i in range(len(built_routes_raw), 3):
            factor = curves[i]
            geom = generate_fallback_geometry(start_lat, start_lon, end_lat, end_lon, factor)
            multiplier = 1.1 + abs(factor) * 0.4
            dist = straight_dist * multiplier
            duration = (dist / 55.0) * 3600.0
            built_routes_raw.append({
                "name": labels[i],
                "geometry": geom,
                "distance_miles": dist,
                "duration_seconds": duration,
            })

    final_routes = []
    all_route_checkpoints = []

    for idx, r_raw in enumerate(built_routes_raw[:3]):
        coords = r_raw["geometry"]
        dist_mi = r_raw["distance_miles"]
        dur_s = r_raw["duration_seconds"]

        cps = sample_checkpoints(
            coordinates=coords,
            interval_miles=sampling_interval_miles,
            total_distance_miles=dist_mi,
            total_duration_seconds=dur_s,
            departure_time=departure_time,
        )

        weather_list = fetch_weather_for_checkpoints(cps)
        combined_cps = []
        for c, w in zip(cps, weather_list):
            combined_cps.append({**c, **w})

        enriched_cps, stats = calculate_route_risk_profile(
            checkpoints_with_weather=combined_cps,
            load_weight_lbs=load_weight_lbs,
            total_distance_miles=dist_mi,
        )

        hours = int(dur_s // 3600)
        minutes = int((dur_s % 3600) // 60)

        route_entry = {
            "id": f"route_{idx + 1}",
            "name": r_raw.get("name", f"Option {idx + 1}"),
            "distance_miles": round(dist_mi, 1),
            "duration_seconds": round(dur_s, 0),
            "duration_formatted": f"{hours}h {minutes}m",
            "coordinates": coords,
            "checkpoints": enriched_cps,
            "stats": stats,
        }
        final_routes.append(route_entry)

        for cp in enriched_cps[::max(1, len(enriched_cps) // 10)]:
            all_route_checkpoints.append({"lat": cp["lat"], "lon": cp["lon"]})

    ranked_routes = rank_routes(final_routes)

    unique_corridor_pts = []
    for pt in all_route_checkpoints:
        if not any(haversine_miles(pt["lat"], pt["lon"], u["lat"], u["lon"]) < 30.0 for u in unique_corridor_pts):
            unique_corridor_pts.append(pt)

    corridor_matrix = fetch_corridor_forecast_matrix(
        corridor_points=unique_corridor_pts[:30],
        departure_dt=departure_time,
        load_weight_lbs=load_weight_lbs,
    )

    return {
        "routes": ranked_routes,
        "corridor_forecast_matrix": corridor_matrix,
        "metadata": {
            "origin": origin,
            "destination": destination,
            "departure_time": departure_time.isoformat(),
            "load_weight_lbs": load_weight_lbs,
            "sampling_interval_miles": sampling_interval_miles,
            "recommended_route_id": ranked_routes[0]["id"] if ranked_routes else None,
        },
    }
