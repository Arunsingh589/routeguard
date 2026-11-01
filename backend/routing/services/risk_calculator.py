from typing import Dict, Any

RISK_ORDER = {
    "Low": 1,
    "Moderate": 2,
    "High": 3,
    "Severe": 4,
    "No Travel": 5,
}

ORDER_TO_RISK = {v: k for k, v in RISK_ORDER.items()}

def classify_wind(wind_mph: float) -> str:
    if wind_mph >= 55.0:
        return "No Travel"
    if wind_mph >= 45.0:
        return "Severe"
    if wind_mph >= 35.0:
        return "High"
    if wind_mph >= 25.0:
        return "Moderate"
    return "Low"

def classify_rain(rain_in_hr: float) -> str:
    if rain_in_hr > 1.00:
        return "No Travel"
    if rain_in_hr >= 0.50:
        return "Severe"
    if rain_in_hr >= 0.25:
        return "High"
    if rain_in_hr >= 0.10:
        return "Moderate"
    return "Low"

def classify_snow(snow_in_hr: float) -> str:
    if snow_in_hr > 3.00:
        return "No Travel"
    if snow_in_hr >= 2.00:
        return "Severe"
    if snow_in_hr >= 1.00:
        return "High"
    if snow_in_hr >= 0.50:
        return "Moderate"
    return "Low"

def evaluate_checkpoint_risk(
    wind_mph: float,
    rain_in_hr: float,
    snow_in_hr: float,
    load_weight_lbs: float,
) -> Dict[str, Any]:
    wind_risk = classify_wind(wind_mph)
    rain_risk = classify_rain(rain_in_hr)
    snow_risk = classify_snow(snow_in_hr)

    base_level = max(
        RISK_ORDER[wind_risk],
        RISK_ORDER[rain_risk],
        RISK_ORDER[snow_risk],
    )
    base_risk = ORDER_TO_RISK[base_level]

    final_risk = base_risk
    applied_rule = None

    if wind_mph >= 55.0:
        final_risk = "No Travel"
        applied_rule = "Wind >= 55 mph: No Travel for any load"
    elif wind_risk == "Severe" and load_weight_lbs > 30000.0:
        final_risk = "No Travel"
        applied_rule = "Wind 45-54 mph + Load > 30,000 lb: Elevated to No Travel"
    elif wind_risk == "High" and load_weight_lbs > 40000.0:
        if RISK_ORDER[final_risk] < RISK_ORDER["Severe"]:
            final_risk = "Severe"
            applied_rule = "Wind 35-44 mph + Load > 40,000 lb: Elevated to Severe"

    return {
        "wind_risk": wind_risk,
        "rain_risk": rain_risk,
        "snow_risk": snow_risk,
        "base_risk": base_risk,
        "final_risk": final_risk,
        "numeric_risk": RISK_ORDER[final_risk],
        "applied_rule": applied_rule,
        "is_no_travel": final_risk == "No Travel",
    }
