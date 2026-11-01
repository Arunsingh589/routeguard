from typing import List, Dict, Any

def rank_routes(routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not routes:
        return []

    def sort_key(route: Dict[str, Any]):
        stats = route.get("stats", {})
        no_travel_miles = float(stats.get("no_travel_miles", 0.0))
        severe_miles = float(stats.get("severe_miles", 0.0))
        high_miles = float(stats.get("high_miles", 0.0))
        avg_risk = float(stats.get("average_risk", 0.0))
        duration_s = float(route.get("duration_seconds", 0.0))
        return (no_travel_miles, severe_miles, high_miles, avg_risk, duration_s)

    sorted_routes = sorted(routes, key=sort_key)

    ranked_results = []
    for index, route in enumerate(sorted_routes):
        updated_route = dict(route)
        updated_route["rank"] = index + 1
        updated_route["is_recommended"] = (index == 0)

        stats = updated_route.get("stats", {})
        severe = stats.get("severe_miles", 0.0)
        no_travel = stats.get("no_travel_miles", 0.0)
        high = stats.get("high_miles", 0.0)
        avg_risk = stats.get("average_risk", 0.0)

        reasons = []
        if index == 0:
            if no_travel == 0 and severe == 0 and high == 0:
                reasons.append("Zero high or severe weather risks identified")
            elif no_travel == 0 and severe == 0:
                reasons.append(f"Lowest hazard profile: 0 severe miles and only {high:.1f} high-risk miles")
            else:
                reasons.append(f"Optimal balance with lowest severe risk exposure ({severe:.1f} mi)")
            reasons.append(f"Average corridor risk score: {avg_risk:.2f}/5.0")
        else:
            diff_severe = severe - sorted_routes[0].get("stats", {}).get("severe_miles", 0.0)
            if no_travel > 0:
                reasons.append(f"Contains {no_travel:.1f} miles of hazardous No-Travel conditions")
            elif diff_severe > 0:
                reasons.append(f"+{diff_severe:.1f} more severe weather miles than recommended route")
            else:
                reasons.append(f"Higher risk index or longer travel duration")

        updated_route["recommendation_notes"] = reasons
        ranked_results.append(updated_route)

    return ranked_results
