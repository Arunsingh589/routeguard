from django.test import TestCase
from rest_framework.test import APIClient
from .services.risk_calculator import (
    classify_wind,
    classify_rain,
    classify_snow,
    evaluate_checkpoint_risk,
)
from .services.recommender import rank_routes

class RiskThresholdTests(TestCase):
    def test_wind_thresholds(self):
        self.assertEqual(classify_wind(10.0), "Low")
        self.assertEqual(classify_wind(24.9), "Low")
        self.assertEqual(classify_wind(25.0), "Moderate")
        self.assertEqual(classify_wind(34.0), "Moderate")
        self.assertEqual(classify_wind(35.0), "High")
        self.assertEqual(classify_wind(44.0), "High")
        self.assertEqual(classify_wind(45.0), "Severe")
        self.assertEqual(classify_wind(54.0), "Severe")
        self.assertEqual(classify_wind(55.0), "No Travel")
        self.assertEqual(classify_wind(70.0), "No Travel")

    def test_rain_thresholds(self):
        self.assertEqual(classify_rain(0.05), "Low")
        self.assertEqual(classify_rain(0.099), "Low")
        self.assertEqual(classify_rain(0.10), "Moderate")
        self.assertEqual(classify_rain(0.25), "High")
        self.assertEqual(classify_rain(0.50), "Severe")
        self.assertEqual(classify_rain(1.00), "Severe")
        self.assertEqual(classify_rain(1.01), "No Travel")

    def test_snow_thresholds(self):
        self.assertEqual(classify_snow(0.2), "Low")
        self.assertEqual(classify_snow(0.49), "Low")
        self.assertEqual(classify_snow(0.50), "Moderate")
        self.assertEqual(classify_snow(1.00), "High")
        self.assertEqual(classify_snow(2.00), "Severe")
        self.assertEqual(classify_snow(3.00), "Severe")
        self.assertEqual(classify_snow(3.01), "No Travel")

class LoadWeightRulesTests(TestCase):
    def test_wind_over_55_no_travel_for_any_load(self):
        res_light = evaluate_checkpoint_risk(56.0, 0.0, 0.0, 10000.0)
        self.assertEqual(res_light["final_risk"], "No Travel")
        self.assertTrue(res_light["is_no_travel"])

        res_heavy = evaluate_checkpoint_risk(55.0, 0.0, 0.0, 60000.0)
        self.assertEqual(res_heavy["final_risk"], "No Travel")

    def test_wind_45_to_54_with_load_over_30k(self):
        res_under = evaluate_checkpoint_risk(48.0, 0.0, 0.0, 25000.0)
        self.assertEqual(res_under["final_risk"], "Severe")

        res_over = evaluate_checkpoint_risk(48.0, 0.0, 0.0, 35000.0)
        self.assertEqual(res_over["final_risk"], "No Travel")
        self.assertIn("30,000", res_over["applied_rule"])

    def test_wind_35_to_44_with_load_over_40k(self):
        res_under = evaluate_checkpoint_risk(40.0, 0.0, 0.0, 35000.0)
        self.assertEqual(res_under["final_risk"], "High")

        res_over = evaluate_checkpoint_risk(40.0, 0.0, 0.0, 45000.0)
        self.assertEqual(res_over["final_risk"], "Severe")
        self.assertIn("40,000", res_over["applied_rule"])

    def test_float_boundaries_between_intervals(self):
        # 54.8 mph with load > 30k lbs must elevate to No Travel
        res1 = evaluate_checkpoint_risk(54.8, 0.0, 0.0, 32000.0)
        self.assertEqual(res1["final_risk"], "No Travel")

        # 44.5 mph with load > 40k lbs must elevate to Severe
        res2 = evaluate_checkpoint_risk(44.5, 0.0, 0.0, 42000.0)
        self.assertEqual(res2["final_risk"], "Severe")

class RecommenderTests(TestCase):
    def test_ranking_prefers_fewer_severe_miles(self):
        route_a = {
            "id": "A",
            "stats": {"severe_miles": 10.0, "high_miles": 5.0, "average_risk": 2.5, "no_travel_miles": 0.0},
            "duration_seconds": 10000,
        }
        route_b = {
            "id": "B",
            "stats": {"severe_miles": 0.0, "high_miles": 20.0, "average_risk": 2.8, "no_travel_miles": 0.0},
            "duration_seconds": 12000,
        }
        ranked = rank_routes([route_a, route_b])
        self.assertEqual(ranked[0]["id"], "B")
        self.assertTrue(ranked[0]["is_recommended"])

    def test_ranking_prefers_fewer_high_miles_when_severe_tied(self):
        route_a = {
            "id": "A",
            "stats": {"severe_miles": 0.0, "high_miles": 15.0, "average_risk": 2.0, "no_travel_miles": 0.0},
            "duration_seconds": 9000,
        }
        route_b = {
            "id": "B",
            "stats": {"severe_miles": 0.0, "high_miles": 5.0, "average_risk": 2.2, "no_travel_miles": 0.0},
            "duration_seconds": 9500,
        }
        ranked = rank_routes([route_a, route_b])
        self.assertEqual(ranked[0]["id"], "B")

    def test_ranking_prefers_lower_avg_risk_when_severe_and_high_tied(self):
        route_a = {
            "id": "A",
            "stats": {"severe_miles": 0.0, "high_miles": 0.0, "average_risk": 1.8, "no_travel_miles": 0.0},
            "duration_seconds": 9000,
        }
        route_b = {
            "id": "B",
            "stats": {"severe_miles": 0.0, "high_miles": 0.0, "average_risk": 1.2, "no_travel_miles": 0.0},
            "duration_seconds": 9500,
        }
        ranked = rank_routes([route_a, route_b])
        self.assertEqual(ranked[0]["id"], "B")

class ApiIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_presets_endpoint(self):
        resp = self.client.get("/api/presets/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("presets", resp.data)
        self.assertTrue(len(resp.data["presets"]) >= 3)

    def test_geocode_endpoint(self):
        resp = self.client.get("/api/geocode/?q=Chicago")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("results", resp.data)

    def test_analyze_route_validation_missing_coords(self):
        resp = self.client.post("/api/routes/analyze/", {}, format="json")
        self.assertEqual(resp.status_code, 400)
