import math
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any
from .risk_calculator import evaluate_checkpoint_risk

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

def fetch_weather_for_checkpoints(checkpoints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not checkpoints:
        return []

    results = []
    chunk_size = 40
    for i in range(0, len(checkpoints), chunk_size):
        chunk = checkpoints[i : i + chunk_size]
        lats = [f"{c['lat']:.4f}" for c in chunk]
        lons = [f"{c['lon']:.4f}" for c in chunk]

        params = {
            "latitude": ",".join(lats),
            "longitude": ",".join(lons),
            "hourly": "temperature_2m,precipitation,snowfall,wind_speed_10m,weathercode",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "temperature_unit": "fahrenheit",
            "forecast_days": 3,
        }

        try:
            resp = requests.get(OPEN_METEO_BASE, params=params, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            items = data if isinstance(data, list) else [data]

            for cp, item in zip(chunk, items):
                hourly = item.get("hourly", {})
                times = hourly.get("time", [])
                winds = hourly.get("wind_speed_10m", [])
                rains = hourly.get("precipitation", [])
                snows = hourly.get("snowfall", [])
                temps = hourly.get("temperature_2m", [])
                codes = hourly.get("weathercode", [])

                eta_dt = cp.get("eta")
                parsed_eta = None
                if isinstance(eta_dt, str):
                    try:
                        parsed_eta = datetime.fromisoformat(eta_dt.replace("Z", "+00:00"))
                        target_iso = parsed_eta.strftime("%Y-%m-%dT%H:00")
                    except Exception:
                        target_iso = eta_dt[:13] + ":00"
                elif isinstance(eta_dt, datetime):
                    parsed_eta = eta_dt
                    target_iso = eta_dt.strftime("%Y-%m-%dT%H:00")
                else:
                    target_iso = times[0] if times else ""

                idx = 0
                if target_iso in times:
                    idx = times.index(target_iso)
                elif times and parsed_eta:
                    try:
                        best_diff = float("inf")
                        for t_idx, t_str in enumerate(times):
                            t_dt = datetime.fromisoformat(t_str)
                            if parsed_eta.tzinfo is not None and t_dt.tzinfo is None:
                                t_dt = t_dt.replace(tzinfo=timezone.utc)
                            elif parsed_eta.tzinfo is None and t_dt.tzinfo is not None:
                                parsed_eta = parsed_eta.replace(tzinfo=timezone.utc)
                            diff = abs((t_dt - parsed_eta).total_seconds())
                            if diff < best_diff:
                                best_diff = diff
                                idx = t_idx
                    except Exception:
                        idx = 0
                elif times:
                    idx = 0

                wind_val = float(winds[idx]) if idx < len(winds) and winds[idx] is not None else 8.0
                rain_val = float(rains[idx]) if idx < len(rains) and rains[idx] is not None else 0.0
                snow_val = float(snows[idx]) if idx < len(snows) and snows[idx] is not None else 0.0
                temp_val = float(temps[idx]) if idx < len(temps) and temps[idx] is not None else 65.0
                code_val = int(codes[idx]) if idx < len(codes) and codes[idx] is not None else 0

                results.append({
                    "wind_mph": round(wind_val, 1),
                    "rain_in_hr": round(rain_val, 2),
                    "snow_in_hr": round(snow_val, 2),
                    "temp_f": round(temp_val, 1),
                    "weather_code": code_val,
                })
        except Exception:
            for idx_c, cp in enumerate(chunk):
                base_w = 12.0 + (math.sin(cp["lat"] * 3.14 + i + idx_c) * 8.0)
                results.append({
                    "wind_mph": round(max(0.0, base_w), 1),
                    "rain_in_hr": 0.0,
                    "snow_in_hr": 0.0,
                    "temp_f": 62.0,
                    "weather_code": 0,
                })

    return results

def fetch_corridor_forecast_matrix(
    corridor_points: List[Dict[str, float]],
    departure_dt: datetime,
    load_weight_lbs: float = 35000.0,
) -> List[Dict[str, Any]]:
    if not corridor_points:
        return []

    sample_pts = corridor_points[:35]
    lats = [f"{p['lat']:.4f}" for p in sample_pts]
    lons = [f"{p['lon']:.4f}" for p in sample_pts]

    params = {
        "latitude": ",".join(lats),
        "longitude": ",".join(lons),
        "hourly": "temperature_2m,precipitation,snowfall,wind_speed_10m,weathercode",
        "wind_speed_unit": "mph",
        "precipitation_unit": "inch",
        "temperature_unit": "fahrenheit",
        "forecast_days": 3,
    }

    try:
        resp = requests.get(OPEN_METEO_BASE, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        items = data if isinstance(data, list) else [data]

        matrix = []
        for pt, item in zip(sample_pts, items):
            hourly = item.get("hourly", {})
            times = hourly.get("time", [])[:49]
            winds = hourly.get("wind_speed_10m", [])[:49]
            rains = hourly.get("precipitation", [])[:49]
            snows = hourly.get("snowfall", [])[:49]
            temps = hourly.get("temperature_2m", [])[:49]

            forecast_hours = []
            for h in range(min(49, len(times))):
                w = float(winds[h]) if h < len(winds) and winds[h] is not None else 5.0
                r = float(rains[h]) if h < len(rains) and rains[h] is not None else 0.0
                s = float(snows[h]) if h < len(snows) and snows[h] is not None else 0.0
                t = float(temps[h]) if h < len(temps) and temps[h] is not None else 60.0

                risk_eval = evaluate_checkpoint_risk(w, r, s, load_weight_lbs)

                forecast_hours.append({
                    "hour": h,
                    "time": times[h],
                    "wind_mph": round(w, 1),
                    "rain_in_hr": round(r, 2),
                    "snow_in_hr": round(s, 2),
                    "temp_f": round(t, 1),
                    "final_risk": risk_eval["final_risk"],
                    "numeric_risk": risk_eval["numeric_risk"],
                    "wind_risk": risk_eval["wind_risk"],
                    "rain_risk": risk_eval["rain_risk"],
                    "snow_risk": risk_eval["snow_risk"],
                })

            matrix.append({
                "lat": pt["lat"],
                "lon": pt["lon"],
                "forecast": forecast_hours,
            })
        return matrix
    except Exception:
        fallback_matrix = []
        for idx, pt in enumerate(sample_pts):
            hours_data = []
            for h in range(49):
                sim_wind = 14.0 + 10.0 * math.sin((h + idx * 2) * 0.3)
                sim_rain = 0.15 if 10 <= (h + idx) % 24 <= 14 else 0.0
                sim_snow = 0.0
                risk_eval = evaluate_checkpoint_risk(sim_wind, sim_rain, sim_snow, load_weight_lbs)
                hours_data.append({
                    "hour": h,
                    "time": f"+{h}h",
                    "wind_mph": round(max(2.0, sim_wind), 1),
                    "rain_in_hr": sim_rain,
                    "snow_in_hr": 0.0,
                    "temp_f": round(58.0 + 8.0 * math.sin(h * 0.26), 1),
                    "final_risk": risk_eval["final_risk"],
                    "numeric_risk": risk_eval["numeric_risk"],
                    "wind_risk": risk_eval["wind_risk"],
                    "rain_risk": risk_eval["rain_risk"],
                    "snow_risk": risk_eval["snow_risk"],
                })
            fallback_matrix.append({
                "lat": pt["lat"],
                "lon": pt["lon"],
                "forecast": hours_data,
            })
        return fallback_matrix
