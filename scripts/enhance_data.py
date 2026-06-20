"""
LittleCam — Advanced Intelligence Data Enhancer
================================================
Reads existing processed JSON files and generates additional
analytics for the advanced intelligence modules.

Outputs (to data/processed/):
    patrol_routes.json    - team routes with distances and coverage
    risk_forecast.json    - 7-day × 4-daypart risk heatmap
    repeat_hotspots.json  - chronic zones with patterns
    sensitive_zones.json  - typed landmarks with proximity multipliers
    daily_brief.json      - operational summary for command center

Usage:
    python scripts/enhance_data.py
"""

import json
import os
from math import radians, cos, sin, asin, sqrt

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")


def load_json(name):
    with open(os.path.join(PROCESSED_DIR, name), "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(name, data):
    path = os.path.join(PROCESSED_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    size_kb = os.path.getsize(path) / 1024
    print(f"  [OK] {name} ({size_kb:.1f} KB)")


def haversine(lat1, lon1, lat2, lon2):
    """Great-circle distance in km."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * 6371 * asin(sqrt(a))


# ---------------------------------------------------------------------------
# Sensitive Zones — typed landmark dataset
# ---------------------------------------------------------------------------
SENSITIVE_ZONES = [
    # Metro stations
    {"name": "Majestic Metro", "lat": 12.9767, "lng": 77.5713, "type": "metro", "multiplier": 1.6},
    {"name": "Indiranagar Metro", "lat": 12.9784, "lng": 77.6408, "type": "metro", "multiplier": 1.6},
    {"name": "MG Road Metro", "lat": 12.9756, "lng": 77.6065, "type": "metro", "multiplier": 1.6},
    {"name": "Cubbon Park Metro", "lat": 12.9796, "lng": 77.5910, "type": "metro", "multiplier": 1.6},
    {"name": "Yelachenahalli Metro", "lat": 12.9147, "lng": 77.5731, "type": "metro", "multiplier": 1.6},
    {"name": "Baiyappanahalli Metro", "lat": 12.9902, "lng": 77.6549, "type": "metro", "multiplier": 1.6},
    {"name": "Peenya Metro", "lat": 13.0321, "lng": 77.5194, "type": "metro", "multiplier": 1.6},
    {"name": "Yeshwanthpur Metro", "lat": 13.0226, "lng": 77.5512, "type": "metro", "multiplier": 1.6},
    {"name": "Rajajinagar Metro", "lat": 12.9988, "lng": 77.5528, "type": "metro", "multiplier": 1.6},
    {"name": "Banashankari Metro", "lat": 12.9255, "lng": 77.5463, "type": "metro", "multiplier": 1.6},
    # Hospitals
    {"name": "Victoria Hospital", "lat": 12.9575, "lng": 77.5736, "type": "hospital", "multiplier": 1.8},
    {"name": "Bowring Hospital", "lat": 12.9869, "lng": 77.6043, "type": "hospital", "multiplier": 1.8},
    {"name": "KC General Hospital", "lat": 12.9850, "lng": 77.5780, "type": "hospital", "multiplier": 1.8},
    {"name": "St. Johns Hospital", "lat": 12.9296, "lng": 77.6210, "type": "hospital", "multiplier": 1.8},
    {"name": "Nimhans", "lat": 12.9417, "lng": 77.5958, "type": "hospital", "multiplier": 1.8},
    # Schools / Educational
    {"name": "Baldwin Schools Area", "lat": 12.9694, "lng": 77.6088, "type": "school", "multiplier": 1.5},
    {"name": "Bishop Cotton School", "lat": 12.9654, "lng": 77.6025, "type": "school", "multiplier": 1.5},
    {"name": "St. Josephs College", "lat": 12.9720, "lng": 77.6005, "type": "school", "multiplier": 1.5},
    {"name": "National College", "lat": 12.9420, "lng": 77.5860, "type": "school", "multiplier": 1.5},
    # Commercial areas / Markets
    {"name": "Commercial Street", "lat": 12.9822, "lng": 77.6097, "type": "commercial", "multiplier": 1.4},
    {"name": "Brigade Road", "lat": 12.9716, "lng": 77.6070, "type": "commercial", "multiplier": 1.4},
    {"name": "KR Market", "lat": 12.9633, "lng": 77.5776, "type": "market", "multiplier": 1.4},
    {"name": "Koramangala 4th Block", "lat": 12.9352, "lng": 77.6245, "type": "commercial", "multiplier": 1.4},
    {"name": "Jayanagar 4th Block", "lat": 12.9267, "lng": 77.5838, "type": "commercial", "multiplier": 1.4},
    {"name": "Whitefield", "lat": 12.9698, "lng": 77.7500, "type": "commercial", "multiplier": 1.4},
    {"name": "Electronic City", "lat": 12.8456, "lng": 77.6603, "type": "commercial", "multiplier": 1.4},
    {"name": "HSR Layout BDA Complex", "lat": 12.9116, "lng": 77.6389, "type": "commercial", "multiplier": 1.4},
    # Transport hubs
    {"name": "Kempegowda Bus Station", "lat": 12.9779, "lng": 77.5720, "type": "metro", "multiplier": 1.6},
    {"name": "Silk Board Junction", "lat": 12.9172, "lng": 77.6227, "type": "commercial", "multiplier": 1.4},
    {"name": "Marathahalli Bridge", "lat": 12.9568, "lng": 77.7011, "type": "commercial", "multiplier": 1.4},
    {"name": "Hebbal Flyover", "lat": 13.0358, "lng": 77.5970, "type": "commercial", "multiplier": 1.4},
    {"name": "KR Pura Railway", "lat": 13.0079, "lng": 77.6940, "type": "metro", "multiplier": 1.6},
    {"name": "JP Nagar", "lat": 12.9073, "lng": 77.5859, "type": "commercial", "multiplier": 1.4},
]


# ===================================================================
# MODULE 1: PATROL ROUTES WITH DISTANCES
# ===================================================================
def generate_patrol_routes(hotspots, deployment):
    """Build geographically-optimized patrol routes grouped into 3 teams.

    Teams are split by police station jurisdiction (Shivajinagar → A,
    Upparpet/City Market → B, others → C). Within each team, stops are
    ordered using a greedy nearest-neighbor heuristic for minimum travel.

    Args:
        hotspots (list[dict]): Full hotspot dataset with centroid coords.
        deployment (dict): Deployment data with 'deployments' list.

    Returns:
        dict: { 'teams': [...], 'total_officers': int }
    """
    print("\n  --- Patrol Route Optimizer ---")

    deployments = deployment.get("deployments", [])
    if not deployments:
        return {"teams": []}

    # Build a hotspot lookup
    hs_map = {h["id"]: h for h in hotspots}

    # Split into 3 patrol teams based on geographic clustering
    # Team A: Shivajinagar area (east-central)
    # Team B: Upparpet/City Market area (west-central)
    # Team C: Other areas (spread)
    teams = {"A": [], "B": [], "C": []}

    for d in deployments:
        station = d.get("police_station", "")
        if station in ("Shivajinagar",):
            teams["A"].append(d)
        elif station in ("Upparpet", "City Market"):
            teams["B"].append(d)
        else:
            teams["C"].append(d)

    result_teams = []
    for team_name, team_deps in teams.items():
        if not team_deps:
            continue

        # Order stops by greedy nearest-neighbor
        ordered = [team_deps[0]]
        remaining = list(team_deps[1:])
        total_distance = 0

        while remaining:
            last = ordered[-1]
            last_h = hs_map.get(last["hotspot_id"])
            if not last_h:
                ordered.append(remaining.pop(0))
                continue

            best_idx, best_dist = 0, float("inf")
            for i, r in enumerate(remaining):
                r_h = hs_map.get(r["hotspot_id"])
                if r_h:
                    d = haversine(last_h["centroid_lat"], last_h["centroid_lng"],
                                  r_h["centroid_lat"], r_h["centroid_lng"])
                    if d < best_dist:
                        best_dist = d
                        best_idx = i
            total_distance += best_dist if best_dist < float("inf") else 0
            ordered.append(remaining.pop(best_idx))

        # Calculate total coverage
        total_impact = sum(d.get("impact_score", 0) for d in ordered)
        total_officers = sum(d.get("officers_allocated", 0) for d in ordered)
        all_impact = sum(d.get("impact_score", 0) for d in deployments)
        coverage_pct = round(total_impact / max(all_impact, 1) * 100, 1)

        stops = []
        for i, d in enumerate(ordered):
            h = hs_map.get(d["hotspot_id"], {})
            dist_to_next = 0
            if i < len(ordered) - 1:
                next_h = hs_map.get(ordered[i + 1]["hotspot_id"], {})
                if h and next_h:
                    dist_to_next = round(haversine(
                        h.get("centroid_lat", 0), h.get("centroid_lng", 0),
                        next_h.get("centroid_lat", 0), next_h.get("centroid_lng", 0)
                    ), 2)

            stops.append({
                "order": i + 1,
                "hotspot_id": d["hotspot_id"],
                "location": d.get("location", ""),
                "police_station": d.get("police_station", ""),
                "impact_score": d.get("impact_score", 0),
                "officers": d.get("officers_allocated", 0),
                "shift": d.get("recommended_shift", "morning"),
                "lat": h.get("centroid_lat", 0),
                "lng": h.get("centroid_lng", 0),
                "distance_to_next_km": dist_to_next,
            })

        result_teams.append({
            "team": f"Team {team_name}",
            "total_stops": len(stops),
            "total_distance_km": round(total_distance, 2),
            "total_officers": total_officers,
            "coverage_pct": coverage_pct,
            "total_impact": round(total_impact, 1),
            "stops": stops,
        })

    print(f"    Teams generated: {len(result_teams)}")
    for t in result_teams:
        print(f"      {t['team']}: {t['total_stops']} stops, {t['total_distance_km']} km, {t['total_officers']} officers")

    return {"teams": result_teams, "total_officers": deployment.get("default_officers", 30)}


# ===================================================================
# MODULE 2: RISK FORECAST HEATMAP
# ===================================================================
def generate_risk_forecast(hotspots):
    """Generate a 7-day × 4-daypart risk heatmap for the top 20 hotspots.

    Each cell is classified as CRITICAL/HIGH/MEDIUM/LOW based on the
    predicted violation count relative to the hotspot's own maximum.

    Args:
        hotspots (list[dict]): Sorted hotspots with 'all_predictions' field.

    Returns:
        dict: { 'forecasts': [...], 'day_labels': [...], 'daypart_labels': [...] }
    """
    print("\n  --- Risk Forecast Heatmap ---")

    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    daypart_labels = ["morning", "midday", "evening", "night"]

    # Take top 20 hotspots
    top_hotspots = hotspots[:20]
    forecasts = []

    for h in top_hotspots:
        preds = h.get("all_predictions", {})
        if not preds:
            continue

        # Build 7×4 heatmap
        heatmap = []
        max_val = max(preds.values()) if preds else 1

        # Calculate historical standard deviation for confidence scoring
        # Get historical averages across all slots for this hotspot to see variance
        hist_counts = list(h.get("hour_distribution", {}).values())
        if len(hist_counts) > 1:
            mean = sum(hist_counts) / len(hist_counts)
            variance = sum((x - mean) ** 2 for x in hist_counts) / len(hist_counts)
            std_dev = variance ** 0.5
            
            # Lower variance (relative to mean) = higher confidence
            cv = (std_dev / mean) if mean > 0 else 1.0
            
            # Scale CV to a confidence percentage (0.2 CV = 95%, 1.0+ CV = 60%)
            confidence_raw = 100 - (cv * 40)
            confidence = max(60, min(98, round(confidence_raw)))
        else:
            confidence = 75 # Default for insufficient data
            
        for dow in range(7):
            row = []
            for dp in daypart_labels:
                key = f"{dow}_{dp}"
                val = preds.get(key, 0)
                # Classify risk
                ratio = val / max(max_val, 1)
                if ratio >= 0.7:
                    risk = "CRITICAL"
                elif ratio >= 0.4:
                    risk = "HIGH"
                elif ratio >= 0.2:
                    risk = "MEDIUM"
                else:
                    risk = "LOW"

                row.append({
                    "day": day_labels[dow],
                    "daypart": dp,
                    "predicted": round(val, 1),
                    "risk": risk,
                    "confidence_pct": confidence
                })
            heatmap.append(row)

        # Find peak risk windows
        all_cells = [(c["predicted"], c["day"], c["daypart"], c["confidence_pct"]) for row in heatmap for c in row]
        all_cells.sort(reverse=True)
        peak_windows = [{"day": c[1], "daypart": c[2], "predicted": c[0], "confidence": c[3]} for c in all_cells[:3]]

        # Generate reason text
        reasons = []
        if h.get("nearest_landmark_dist_m", 9999) < 500:
            reasons.append(f"Near {h.get('nearest_landmark', 'landmark')}")
        reasons.append(f"{h.get('dominant_violation', 'Parking violation')}")
        reasons.append(f"{h.get('violations_per_week', 0):.0f} violations/week historically")
        if h.get("distinct_weeks", 0) >= 15:
            reasons.append("Chronic recurring hotspot")

        forecasts.append({
            "hotspot_id": h["id"],
            "rank": h["rank"],
            "location": h.get("location_name", ""),
            "police_station": h.get("police_station", ""),
            "impact_score": h["impact_score"],
            "base_confidence_pct": confidence,
            "heatmap": heatmap,
            "peak_windows": peak_windows,
            "reasons": reasons,
        })

    print(f"    Forecasts for {len(forecasts)} hotspots")
    return {"forecasts": forecasts, "day_labels": day_labels, "daypart_labels": daypart_labels}


# ===================================================================
# MODULE 3: REPEAT HOTSPOT ANALYSIS
# ===================================================================
def generate_repeat_hotspots(hotspots):
    """Identify chronic repeat offender locations.

    A hotspot is considered chronic if violations appear in ≥70% of the
    total data weeks. Includes weekday/weekend pattern analysis and
    enforcement recommendations.

    Args:
        hotspots (list[dict]): Full hotspot dataset with distinct_weeks.

    Returns:
        dict: { 'chronic_hotspots': [...], 'threshold_weeks': int, 'total_data_weeks': int }
    """
    print("\n  --- Repeat Hotspot Intelligence ---")

    # Chronic = appearing in >= 75% of total weeks
    total_data_weeks = 20  # ~20 weeks of data
    threshold = int(total_data_weeks * 0.70)  # 14+ weeks

    chronic = []
    for h in hotspots:
        dw = h.get("distinct_weeks", 0)
        if dw < threshold:
            continue

        # Identify peak day pattern
        dow_dist = h.get("day_of_week_distribution", {})
        if dow_dist:
            sorted_days = sorted(dow_dist.items(), key=lambda x: x[1], reverse=True)
            peak_days = [int(float(d)) for d, _ in sorted_days[:3]]
            day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            peak_day_names = [day_names[d] for d in peak_days if 0 <= d <= 6]
        else:
            peak_day_names = []

        # Identify peak time
        dp_dist = h.get("day_part_distribution", {})
        peak_daypart = max(dp_dist, key=dp_dist.get) if dp_dist else "morning"

        hour_dist = h.get("hour_distribution", {})
        if hour_dist:
            sorted_hours = sorted(hour_dist.items(), key=lambda x: x[1], reverse=True)
            peak_hour = int(float(sorted_hours[0][0]))
            peak_time_str = f"{peak_hour}:00 - {peak_hour + 3}:00"
        else:
            peak_time_str = "Unknown"

        # Weekday vs weekend pattern
        weekday_count = sum(dow_dist.get(str(float(d)), 0) for d in range(5))
        weekend_count = sum(dow_dist.get(str(float(d)), 0) for d in range(5, 7))
        total = weekday_count + weekend_count
        weekday_pct = round(weekday_count / max(total, 1) * 100, 1)

        if weekday_pct > 70:
            pattern = "Primarily weekday"
        elif weekday_pct < 40:
            pattern = "Primarily weekend"
        else:
            pattern = "All week"

        # Recommendation
        if dw >= total_data_weeks - 2:
            recommendation = "Permanent enforcement window recommended"
        elif dw >= threshold:
            recommendation = "Regular scheduled patrol recommended"
        else:
            recommendation = "Monitor and reassess"

        chronic.append({
            "hotspot_id": h["id"],
            "rank": h["rank"],
            "location": h.get("location_name", ""),
            "police_station": h.get("police_station", ""),
            "impact_score": h["impact_score"],
            "distinct_weeks": dw,
            "total_weeks": total_data_weeks,
            "recurrence_pct": round(dw / total_data_weeks * 100, 1),
            "violations_per_week": h.get("violations_per_week", 0),
            "total_violations": h.get("violation_count", 0),
            "peak_days": peak_day_names,
            "peak_daypart": peak_daypart,
            "peak_time": peak_time_str,
            "pattern": pattern,
            "weekday_pct": weekday_pct,
            "dominant_violation": h.get("dominant_violation", ""),
            "dominant_vehicle": h.get("dominant_vehicle", ""),
            "recommendation": recommendation,
        })

    # Sort by recurrence then impact
    chronic.sort(key=lambda x: (x["recurrence_pct"], x["impact_score"]), reverse=True)

    print(f"    Chronic hotspots found: {len(chronic)} (threshold: {threshold}+ weeks)")
    if chronic:
        print(f"    Top: {chronic[0]['police_station']} — {chronic[0]['recurrence_pct']}% recurrence")

    return {"chronic_hotspots": chronic, "threshold_weeks": threshold, "total_data_weeks": total_data_weeks}


# ===================================================================
# MODULE 4: SENSITIVE ZONES
# ===================================================================
def generate_sensitive_zones(hotspots):
    """Cross-reference hotspots against sensitive urban zones.

    For each zone (metro, hospital, school, commercial), finds hotspots
    within 1 km and applies a type-specific safety multiplier to compute
    an adjusted impact score.

    Args:
        hotspots (list[dict]): Full hotspot dataset with centroid coords.

    Returns:
        dict: { 'zones': [...], 'type_icons': {...} }
    """
    print("\n  --- Sensitive Zone Analysis ---")

    # Find hotspots near each sensitive zone
    zone_impacts = []
    for zone in SENSITIVE_ZONES:
        nearby = []
        for h in hotspots:
            dist = haversine(zone["lat"], zone["lng"],
                             h["centroid_lat"], h["centroid_lng"])
            if dist < 1.0:  # within 1km
                nearby.append({
                    "hotspot_id": h["id"],
                    "distance_m": round(dist * 1000),
                    "impact_score": h["impact_score"],
                    "violations": h["violation_count"],
                    "adjusted_score": round(min(h["impact_score"] * zone["multiplier"], 100), 1),
                })

        nearby.sort(key=lambda x: x["distance_m"])

        zone_impacts.append({
            "name": zone["name"],
            "lat": zone["lat"],
            "lng": zone["lng"],
            "type": zone["type"],
            "multiplier": zone["multiplier"],
            "nearby_hotspots": len(nearby),
            "nearby_details": nearby[:5],  # top 5 closest
            "total_violations_nearby": sum(n["violations"] for n in nearby),
            "max_adjusted_score": max((n["adjusted_score"] for n in nearby), default=0),
        })

    # Sort by threat level
    zone_impacts.sort(key=lambda x: x["total_violations_nearby"], reverse=True)

    type_counts = {}
    for z in zone_impacts:
        t = z["type"]
        type_counts[t] = type_counts.get(t, 0) + 1

    print(f"    Sensitive zones: {len(zone_impacts)}")
    print(f"    Types: {type_counts}")
    print(f"    Most impacted: {zone_impacts[0]['name']} ({zone_impacts[0]['total_violations_nearby']} violations nearby)")

    return {"zones": zone_impacts, "type_icons": {
        "metro": "🚇", "hospital": "🏥", "school": "🏫",
        "commercial": "🏢", "market": "🛒"
    }}


# ===================================================================
# MODULE 5: DAILY BRIEF
# ===================================================================
def generate_daily_brief(hotspots, deployment, simulation, summary):
    """Compile the daily operational intelligence brief.

    Produces a printable summary with priority areas for the next shift,
    officer deployment recommendations, key findings, and executive stats.
    This is the primary artifact for the command center.

    Args:
        hotspots (list[dict]): Full hotspot dataset.
        deployment (dict): Officer deployment data.
        simulation (dict): Before/after simulation results.
        summary (dict): Executive summary statistics.

    Returns:
        dict: Complete daily brief with all sections.
    """
    print("\n  --- Daily Brief Generator ---")

    import datetime
    today = datetime.date.today()
    dow = today.weekday()
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    # Determine current shift based on time
    now = datetime.datetime.now()
    if 6 <= now.hour < 11:
        current_shift = "morning"
        next_shift = "midday"
    elif 11 <= now.hour < 16:
        current_shift = "midday"
        next_shift = "evening"
    elif 16 <= now.hour < 21:
        current_shift = "evening"
        next_shift = "night"
    else:
        current_shift = "night"
        next_shift = "morning"

    # Priority areas for next shift
    dp_key = f"{dow}_{next_shift}"
    priority_areas = []
    for h in hotspots[:15]:
        pred = h.get("all_predictions", {}).get(dp_key, 0)
        priority_areas.append({
            "hotspot_id": h["id"],
            "rank": h["rank"],
            "location": h.get("location_name", ""),
            "police_station": h.get("police_station", ""),
            "impact_score": h["impact_score"],
            "predicted_violations": round(pred, 1),
            "dominant_violation": h.get("dominant_violation", ""),
            "nearest_landmark": h.get("nearest_landmark", ""),
        })

    # Sort by predicted violations for this shift
    priority_areas.sort(key=lambda x: x["predicted_violations"], reverse=True)

    # Deployment recommendations for top 5
    deploy_recs = []
    available = deployment.get("default_officers", 30)
    remaining = available
    for area in priority_areas[:8]:
        if remaining <= 0:
            break
        officers = max(2, min(6, round(area["predicted_violations"])))
        officers = min(officers, remaining)
        remaining -= officers

        reason_parts = []
        if area["nearest_landmark"]:
            reason_parts.append(f"Near {area['nearest_landmark']}")
        reason_parts.append(f"{next_shift} peak risk")
        reason_parts.append(f"{area['predicted_violations']} violations predicted")

        deploy_recs.append({
            "location": area["police_station"],
            "officers": officers,
            "reason": " · ".join(reason_parts),
            "impact_score": area["impact_score"],
        })

    # Executive stats
    total_critical = len([h for h in hotspots if h["impact_score"] >= 60])
    total_high = len([h for h in hotspots if 45 <= h["impact_score"] < 60])

    # Estimated improvements
    avg_improvement = summary.get("projected_improvement_pct", 0)
    violations_prevented = summary.get("total_violations_prevented_weekly", 0)

    brief = {
        "date": str(today),
        "day": day_names[dow],
        "generated_at": now.strftime("%H:%M"),
        "current_shift": current_shift,
        "next_shift": next_shift,
        "headline": f"Bengaluru Parking Intelligence Brief — {day_names[dow]}, {today.strftime('%d %B %Y')}",
        "stats": {
            "total_violations_analyzed": summary.get("total_violations_analyzed", 0),
            "total_hotspots": len(hotspots),
            "critical_hotspots": total_critical,
            "high_risk_hotspots": total_high,
            "officers_available": available,
            "projected_improvement": avg_improvement,
            "violations_prevented_weekly": violations_prevented,
        },
        "priority_areas": priority_areas[:10],
        "deployment_recommendations": deploy_recs,
        "shift_focus": next_shift,
        "key_findings": [
            f"AI analyzed {summary.get('total_violations_analyzed', 0):,} parking violations across {len(hotspots)} hotspots",
            f"{total_critical} critical zones identified (Impact Score ≥ 60)",
            f"Top 10 zones account for {summary.get('top_10_zones_impact_share_pct', 0)}% of violations",
            f"Deploying {available} officers strategically can achieve estimated {avg_improvement}% improvement",
            f"Projected {violations_prevented} violations prevented per week",
        ],
        
        # New Natural Language Executive Summary
        "executive_summary": (
            f"COMMAND BRIEFING: {day_names[dow]}, {today.strftime('%B %d, %Y')} - {now.strftime('%H:%M')} HRS\n\n"
            f"SYSTEM STATUS: The intelligence pipeline analyzed {summary.get('total_violations_analyzed', 0):,} "
            f"historical records, identifying {total_critical} CRITICAL and {total_high} HIGH risk zones for the upcoming {next_shift} shift. "
            f"Overall network risk is currently {'ELEVATED' if total_critical > 5 else 'NOMINAL'}.\n\n"
            f"OPERATIONAL FOCUS: Primary enforcement should target {priority_areas[0]['police_station']} "
            f"({priority_areas[0]['predicted_violations']} predicted incidents, primarily {priority_areas[0]['dominant_violation'].lower()}) "
            f"and {priority_areas[1]['police_station']} ({priority_areas[1]['predicted_violations']} incidents). "
            f"Both locations show high historical recurrence and severe congestion impact.\n\n"
            f"RESOURCE ALLOCATION: With {available} officers available, the system recommends deploying "
            f"teams to the top {len(deploy_recs)} hotspots. This strategic deployment model is projected to yield a "
            f"{avg_improvement}% improvement in traffic flow and prevent approximately {violations_prevented} violations "
            f"in the next operational period."
        ),
        
        "methodology_note": "All predictions and scores are AI-generated proxy metrics for decision support. Not validated causal measurements.",
    }

    print(f"    Brief for: {brief['headline']}")
    print(f"    Next shift: {next_shift}")
    print(f"    Priority areas: {len(priority_areas[:10])}")
    print(f"    Deploy recommendations: {len(deploy_recs)}")

    return brief


# ===================================================================
# MAIN
# ===================================================================
def main():
    print("=" * 70)
    print("LITTLECAM — ADVANCED INTELLIGENCE DATA ENHANCER")
    print("=" * 70)

    # Load existing data
    print("\n  Loading existing processed data...")
    hotspots = load_json("hotspots.json")
    deployment = load_json("deployment.json")
    simulation = load_json("simulation.json")
    summary = load_json("summary.json")

    print(f"    Hotspots: {len(hotspots)}")
    print(f"    Deployments: {len(deployment.get('deployments', []))}")

    # Generate enhanced analytics
    patrol_routes = generate_patrol_routes(hotspots, deployment)
    risk_forecast = generate_risk_forecast(hotspots)
    repeat_hotspots = generate_repeat_hotspots(hotspots)
    sensitive_zones = generate_sensitive_zones(hotspots)
    daily_brief = generate_daily_brief(hotspots, deployment, simulation, summary)

    # Save
    print("\n" + "=" * 70)
    print("WRITING ENHANCED OUTPUT FILES")
    print("=" * 70)

    save_json("patrol_routes.json", patrol_routes)
    save_json("risk_forecast.json", risk_forecast)
    save_json("repeat_hotspots.json", repeat_hotspots)
    save_json("sensitive_zones.json", sensitive_zones)
    save_json("daily_brief.json", daily_brief)

    print("\n" + "=" * 70)
    print("ENHANCEMENT COMPLETE — 5 new JSON files generated")
    print("=" * 70)


if __name__ == "__main__":
    main()
