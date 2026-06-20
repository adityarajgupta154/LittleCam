"""
LittleCam - Offline Data Processing Pipeline
=============================================
Takes the raw Bengaluru parking-violation CSV and produces all the
pre-computed JSON files that the static frontend consumes.

Usage:
    python scripts/process_data.py

Outputs (to data/processed/):
    hotspots.json    - clustered hotspots with scores, breakdowns, trends
    worklist.json    - ranked enforcement worklist for next shift
    deployment.json  - officer allocation, shift plans, ROI
    simulation.json  - before/after enforcement estimates
    summary.json     - executive command summary stats
    trends.json      - time-series data per hotspot for charts

NOTE: The Congestion Impact Score is an engineered proxy metric,
NOT a validated causal measurement. See README.md.

Scalability: the only city-specific code is the landmark list.
Swap the CSV and the landmarks for another city - no rewrite needed.
"""

import ast
import json
import os
import sys
import warnings
from collections import Counter
from math import radians, cos, sin, asin, sqrt

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_CSV = os.path.join(BASE_DIR, "jan to may police violation_anonymized791b166.csv")
OUT_DIR = os.path.join(BASE_DIR, "data", "processed")
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Curated Bengaluru Landmarks (metro stations + commercial hubs)
# Swap this list for a different city - that's the only city-specific piece.
# ---------------------------------------------------------------------------
LANDMARKS = [
    {"name": "Majestic Metro", "lat": 12.9767, "lng": 77.5713},
    {"name": "Indiranagar Metro", "lat": 12.9784, "lng": 77.6408},
    {"name": "MG Road Metro", "lat": 12.9756, "lng": 77.6065},
    {"name": "Cubbon Park Metro", "lat": 12.9796, "lng": 77.5910},
    {"name": "Yelachenahalli Metro", "lat": 12.9147, "lng": 77.5731},
    {"name": "Baiyappanahalli Metro", "lat": 12.9902, "lng": 77.6549},
    {"name": "Peenya Metro", "lat": 13.0321, "lng": 77.5194},
    {"name": "Nagasandra Metro", "lat": 13.0451, "lng": 77.5142},
    {"name": "Kempegowda Bus Station", "lat": 12.9779, "lng": 77.5720},
    {"name": "Silk Board Junction", "lat": 12.9172, "lng": 77.6227},
    {"name": "KR Market", "lat": 12.9633, "lng": 77.5776},
    {"name": "Commercial Street", "lat": 12.9822, "lng": 77.6097},
    {"name": "Brigade Road", "lat": 12.9716, "lng": 77.6070},
    {"name": "Koramangala 4th Block", "lat": 12.9352, "lng": 77.6245},
    {"name": "Whitefield", "lat": 12.9698, "lng": 77.7500},
    {"name": "Electronic City", "lat": 12.8456, "lng": 77.6603},
    {"name": "Jayanagar 4th Block", "lat": 12.9267, "lng": 77.5838},
    {"name": "Marathahalli Bridge", "lat": 12.9568, "lng": 77.7011},
    {"name": "Hebbal Flyover", "lat": 13.0358, "lng": 77.5970},
    {"name": "KR Pura Railway", "lat": 13.0079, "lng": 77.6940},
    {"name": "Yeshwanthpur Metro", "lat": 13.0226, "lng": 77.5512},
    {"name": "Rajajinagar Metro", "lat": 12.9988, "lng": 77.5528},
    {"name": "Banashankari Metro", "lat": 12.9255, "lng": 77.5463},
    {"name": "JP Nagar", "lat": 12.9073, "lng": 77.5859},
    {"name": "HSR Layout BDA Complex", "lat": 12.9116, "lng": 77.6389},
]

# ---------------------------------------------------------------------------
# Weight tables
# ---------------------------------------------------------------------------
VEHICLE_SEVERITY = {
    "HEAVY": 1.0,
    "LCV": 0.7,
    "CAR": 0.5,
    "AUTO": 0.4,
    "TWO_WHEELER": 0.2,
    "OTHER": 0.3,
}

VIOLATION_SEVERITY = {
    "DOUBLE PARKING": 1.0,
    "PARKING IN A MAIN ROAD": 0.9,
    "PARKING ON FOOTPATH": 0.8,
    "PARKING NEAR ROAD CROSSING": 0.8,
    "PARKING NEAR TRAFFIC LIGHT OR ZEBRA CROSS": 0.8,
    "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC": 0.7,
    "PARKING OPPOSITE TO ANOTHER PARKED VEHICLE": 0.6,
    "NO PARKING": 0.5,
    "WRONG PARKING": 0.3,
    "PARKING OTHER THAN BUS STOP": 0.4,
    "DEFECTIVE NUMBER PLATE": 0.1,
    "USING BLACK FILM/OTHER MATERIALS": 0.1,
    "DEMANDING EXCESS FARE": 0.0,
    "REFUSE TO GO FOR HIRE": 0.0,
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def haversine(lat1, lon1, lat2, lon2):
    """Great-circle distance in metres."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * 6371000 * asin(sqrt(a))


def nearest_landmark(lat, lng):
    """Return (name, distance_m) of closest landmark."""
    best_name, best_dist = None, float("inf")
    for lm in LANDMARKS:
        d = haversine(lat, lng, lm["lat"], lm["lng"])
        if d < best_dist:
            best_dist = d
            best_name = lm["name"]
    return best_name, best_dist


def parse_violation_types(raw):
    """Parse the JSON-array string into a Python list of strings."""
    if pd.isna(raw):
        return []
    try:
        parsed = ast.literal_eval(raw)
        return parsed if isinstance(parsed, list) else [str(parsed)]
    except Exception:
        return [str(raw)]


def categorize_vehicle(vtype):
    """Normalize vehicle_type into broad categories."""
    if pd.isna(vtype):
        return "OTHER"
    v = vtype.upper().strip()
    if v in ("SCOOTER", "MOTOR CYCLE", "MOPED"):
        return "TWO_WHEELER"
    if v in ("CAR", "JEEP"):
        return "CAR"
    if v in ("PASSENGER AUTO", "GOODS AUTO"):
        return "AUTO"
    if v in ("BUS (BMTC/KSRTC)", "PRIVATE BUS", "TOURIST BUS", "FACTORY BUS",
             "SCHOOL VEHICLE", "HGV", "LORRY/GOODS VEHICLE", "TANKER", "MAXI-CAB"):
        return "HEAVY"
    if v in ("LGV", "VAN", "TEMPO"):
        return "LCV"
    return "OTHER"


def day_part(hour):
    """Map hour to day-part label."""
    if 6 <= hour < 11:
        return "morning"
    if 11 <= hour < 16:
        return "midday"
    if 16 <= hour < 21:
        return "evening"
    return "night"


def safe_json(obj):
    """Make numpy types JSON-serializable."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return round(float(obj), 4)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


# ===================================================================
# STEP 1 - LOAD & CLEAN
# ===================================================================
def step1_clean(csv_path):
    """Load the raw violation CSV and apply cleaning pipeline.

    Operations:
      1. Parse datetime to IST, extract hour/day_of_week/month/week/day_part.
      2. Parse violation_type JSON-array strings into Python lists.
      3. Categorize vehicle_type into broad groups (TWO_WHEELER, CAR, etc.).
      4. Filter to approved records only.
      5. Drop rows with null datetime or coordinates outside Bengaluru metro.

    Args:
        csv_path (str): Absolute path to the raw anonymized CSV.

    Returns:
        pd.DataFrame: Cleaned, approved-only dataframe with derived columns.
    """
    print("=" * 70)
    print("STEP 1 - LOADING & CLEANING DATA")
    print("=" * 70)

    df = pd.read_csv(csv_path, low_memory=False)
    print(f"  Raw rows loaded: {len(df):,}")

    # Parse datetime
    df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)

    # Convert to IST
    df["created_ist"] = df["created_datetime"].dt.tz_convert("Asia/Kolkata")
    df["hour"] = df["created_ist"].dt.hour
    df["day_of_week"] = df["created_ist"].dt.dayofweek  # 0=Mon
    df["month"] = df["created_ist"].dt.month
    df["date"] = df["created_ist"].dt.date
    # Drop rows with unparseable datetime first
    df = df.dropna(subset=["created_datetime"]).copy()
    df["week"] = df["created_ist"].dt.isocalendar().week.astype(int)
    df["day_part"] = df["hour"].apply(day_part)
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)

    # Parse violation types
    df["violation_list"] = df["violation_type"].apply(parse_violation_types)
    df["primary_violation"] = df["violation_list"].apply(
        lambda x: x[0] if x else "UNKNOWN"
    )

    # Categorize vehicle
    df["vehicle_category"] = df["vehicle_type"].apply(categorize_vehicle)

    # Filter to approved only
    df_approved = df[df["validation_status"] == "approved"].copy()
    print(f"  Approved rows: {len(df_approved):,}")

    # Drop rows with bad datetime
    df_approved = df_approved.dropna(subset=["created_datetime"])
    print(f"  After dropping null datetime: {len(df_approved):,}")

    # Drop clearly invalid coords (outside Bengaluru metro area)
    mask = (
        (df_approved["latitude"] >= 12.7)
        & (df_approved["latitude"] <= 13.3)
        & (df_approved["longitude"] >= 77.3)
        & (df_approved["longitude"] <= 77.9)
    )
    df_approved = df_approved[mask].copy()
    print(f"  After coord filtering: {len(df_approved):,}")

    # Summary
    print(f"\n  Date range: {df_approved['created_ist'].min()} -> {df_approved['created_ist'].max()}")
    print(f"  Unique police stations: {df_approved['police_station'].nunique()}")
    print(f"  Top violation types:")
    for vt, cnt in df_approved["primary_violation"].value_counts().head(5).items():
        print(f"    {vt}: {cnt:,}")
    print(f"  Top vehicle categories:")
    for vc, cnt in df_approved["vehicle_category"].value_counts().items():
        print(f"    {vc}: {cnt:,}")

    return df_approved


# ===================================================================
# STEP 2 - GRID-BASED HOTSPOT CLUSTERING
# ===================================================================
def step2_cluster(df):
    """Cluster violations into spatial hotspots using grid-based binning.

    Uses a 0.002° (~220m) grid instead of DBSCAN for O(n) memory
    scalability on 100K+ rows. Cells with fewer than MIN_VIOLATIONS
    are discarded as noise.

    Args:
        df (pd.DataFrame): Cleaned violation data from step1.

    Returns:
        tuple: (df_clustered, n_clusters)
            - df_clustered: DataFrame with 'cluster' column (noise removed).
            - n_clusters: Number of valid hotspot cells found.
    """
    print("\n" + "=" * 70)
    print("STEP 2 - GRID-BASED HOTSPOT CLUSTERING")
    print("=" * 70)

    # Grid-based spatial binning: ~200m cells (0.002 degrees ≈ 220m)
    # This is O(n) memory vs DBSCAN's O(n²) — critical for 115K+ rows
    GRID_SIZE = 0.002  # degrees, ~220m at Bengaluru's latitude
    MIN_VIOLATIONS = 15  # minimum to form a hotspot (same as DBSCAN min_samples)

    df = df.copy()

    # Assign each point to a grid cell
    df["grid_lat"] = (df["latitude"] / GRID_SIZE).astype(int)
    df["grid_lng"] = (df["longitude"] / GRID_SIZE).astype(int)
    df["grid_key"] = df["grid_lat"].astype(str) + "_" + df["grid_lng"].astype(str)

    # Count violations per grid cell
    cell_counts = df["grid_key"].value_counts()
    valid_cells = cell_counts[cell_counts >= MIN_VIOLATIONS].index

    # Assign cluster IDs to valid cells (-1 for noise)
    cell_to_cluster = {cell: idx for idx, cell in enumerate(sorted(valid_cells))}
    df["cluster"] = df["grid_key"].map(cell_to_cluster).fillna(-1).astype(int)

    n_clusters = len(valid_cells)
    noise = (df["cluster"] == -1).sum()
    print(f"  Grid cell size: {GRID_SIZE}° (~220m)")
    print(f"  Hotspot cells found: {n_clusters}")
    print(f"  Noise points: {noise:,} ({noise/len(df)*100:.1f}%)")

    # Filter to clustered points only
    df_clustered = df[df["cluster"] != -1].copy()
    print(f"  Clustered violations: {len(df_clustered):,}")

    # Clean up temp columns
    df_clustered = df_clustered.drop(columns=["grid_lat", "grid_lng", "grid_key"])

    return df_clustered, n_clusters


# ===================================================================
# STEP 3 - COMPUTE HOTSPOT PROFILES + CONGESTION IMPACT SCORE
# ===================================================================
def step3_score(df_clustered, total_weeks):
    """Compute the Congestion Impact Score (0–100) for each hotspot cluster.

    Score = Violation Density (35pts) + Landmark Proximity (20pts)
          + Peak Hour Effect (15pts) + Vehicle Severity (12pts)
          + Violation Severity (9pts) + Historical Recurrence (9pts)

    Also computes per-hotspot breakdowns: hour/day-part/day-of-week
    distributions, vehicle/violation type distributions, and location metadata.

    Args:
        df_clustered (pd.DataFrame): Clustered data from step2.
        total_weeks (int): Number of calendar weeks in the dataset.

    Returns:
        list[dict]: Hotspot dicts sorted by impact_score descending,
                    each with rank, breakdowns, distributions, and location.
    """
    print("\n" + "=" * 70)
    print("STEP 3 - CONGESTION IMPACT SCORE")
    print("=" * 70)

    hotspots = []
    clusters = sorted(df_clustered["cluster"].unique())

    # Pre-compute max violation count for normalization
    cluster_counts = df_clustered["cluster"].value_counts()
    max_count = cluster_counts.max()
    log_max = np.log1p(max_count)

    for cid in clusters:
        cdf = df_clustered[df_clustered["cluster"] == cid]
        count = len(cdf)

        centroid_lat = cdf["latitude"].mean()
        centroid_lng = cdf["longitude"].mean()

        # Dominant violation & vehicle
        primary_violations = cdf["primary_violation"].value_counts()
        dominant_violation = primary_violations.index[0]

        vehicle_cats = cdf["vehicle_category"].value_counts()
        dominant_vehicle = vehicle_cats.index[0]

        # Police station & junction
        station = cdf["police_station"].mode().iloc[0] if not cdf["police_station"].mode().empty else "Unknown"

        junctions = cdf[cdf["junction_name"] != "No Junction"]["junction_name"]
        junction = junctions.mode().iloc[0] if len(junctions) > 0 and not junctions.mode().empty else "No Junction"

        # Representative location (shortest common location string)
        location_name = cdf["location"].dropna().mode()
        location_name = location_name.iloc[0] if len(location_name) > 0 else "Unknown"
        # Truncate to first part
        if isinstance(location_name, str) and len(location_name) > 80:
            location_name = location_name[:77] + "..."

        # Time distributions
        hour_dist = cdf["hour"].value_counts().sort_index().to_dict()
        day_part_dist = cdf["day_part"].value_counts().to_dict()
        dow_dist = cdf["day_of_week"].value_counts().sort_index().to_dict()

        peak_hours = cdf["hour"].value_counts().head(3).index.tolist()

        # Violations per week
        violations_per_week = round(count / max(total_weeks, 1), 1)

        # Distinct weeks with violations (recurrence)
        distinct_weeks = cdf["week"].nunique()

        # Vehicle category distribution
        vehicle_dist = cdf["vehicle_category"].value_counts().to_dict()

        # Violation type distribution (all types, not just primary)
        all_vtypes = []
        for vlist in cdf["violation_list"]:
            all_vtypes.extend(vlist)
        violation_dist = dict(Counter(all_vtypes))

        # ======================
        # CONGESTION IMPACT SCORE
        # ======================

        # Component 1: Violation Density (35 pts)
        density_score = (np.log1p(count) / log_max) * 35

        # Component 2: Proximity to Landmark (20 pts)
        lm_name, lm_dist = nearest_landmark(centroid_lat, centroid_lng)
        if lm_dist < 200:
            proximity_score = 20
        elif lm_dist < 500:
            proximity_score = 15
        elif lm_dist < 1000:
            proximity_score = 10
        else:
            proximity_score = 5

        # Component 3: Peak Hour Multiplier (15 pts)
        peak_violations = cdf[cdf["hour"].isin([8, 9, 10, 17, 18, 19, 20])].shape[0]
        peak_ratio = peak_violations / count if count > 0 else 0
        peak_score = peak_ratio * 15

        # Component 4: Vehicle Severity (12 pts)
        veh_severity_sum = sum(
            VEHICLE_SEVERITY.get(cat, 0.3) * cnt
            for cat, cnt in vehicle_dist.items()
        )
        veh_severity_avg = veh_severity_sum / count if count > 0 else 0
        vehicle_score = veh_severity_avg * 12

        # Component 5: Violation Severity (9 pts)
        viol_severity_sum = sum(
            VIOLATION_SEVERITY.get(vt, 0.3) * cnt
            for vt, cnt in violation_dist.items()
        )
        total_violations_expanded = sum(violation_dist.values())
        viol_severity_avg = viol_severity_sum / total_violations_expanded if total_violations_expanded > 0 else 0
        violation_score = viol_severity_avg * 9

        # Component 6: Historical Recurrence (9 pts)
        recurrence_ratio = distinct_weeks / max(total_weeks, 1)
        recurrence_score = min(recurrence_ratio, 1.0) * 9

        # Total
        impact_score = round(
            min(density_score + proximity_score + peak_score +
                vehicle_score + violation_score + recurrence_score, 100), 1
        )

        hotspot = {
            "id": int(cid),
            "centroid_lat": round(centroid_lat, 6),
            "centroid_lng": round(centroid_lng, 6),
            "violation_count": int(count),
            "violations_per_week": violations_per_week,
            "dominant_violation": dominant_violation,
            "dominant_vehicle": dominant_vehicle,
            "police_station": station,
            "junction_name": junction,
            "location_name": location_name,
            "peak_hours": [int(h) for h in peak_hours],
            "distinct_weeks": int(distinct_weeks),
            "nearest_landmark": lm_name,
            "nearest_landmark_dist_m": round(lm_dist, 0),
            "impact_score": impact_score,
            "score_breakdown": {
                "violation_density": round(density_score, 1),
                "proximity_to_landmark": round(proximity_score, 1),
                "peak_hour_effect": round(peak_score, 1),
                "vehicle_severity": round(vehicle_score, 1),
                "violation_severity": round(viol_severity_atg, 1),
                "historical_recurrence": round(recurrence_score, 1),
            },
            "hour_distribution": {str(k): int(v) for k, v in hour_dist.items()},
            "day_part_distribution": day_part_dist,
            "day_of_week_distribution": {str(k): int(v) for k, v in dow_dist.items()},
            "vehicle_distribution": {k: int(v) for k, v in vehicle_dist.items()},
            "violation_distribution": {k: int(v) for k, v in violation_dist.items()},
        }
        hotspots.append(hotspot)

    # Sort by impact score descending
    hotspots.sort(key=lambda h: h["impact_score"], reverse=True)

    # Assign ranks
    for i, h in enumerate(hotspots):
        h["rank"] = i + 1

    print(f"  Hotspots scored: {len(hotspots)}")
    print(f"  Score range: {hotspots[-1]['impact_score']} - {hotspots[0]['impact_score']}")
    print(f"\n  Top 10 hotspots:")
    for h in hotspots[:10]:
        print(f"    #{h['rank']:2d}  Score={h['impact_score']:5.1f}  "
              f"Violations={h['violation_count']:5d}  "
              f"Station={h['police_station']}  "
              f"Near={h['nearest_landmark']}")

    return hotspots


# ===================================================================
# STEP 4 - FORECASTING MODEL
# ===================================================================
def step4_forecast(df_clustered, hotspots):
    """Generate violation count predictions per hotspot × day × day-part.

    Attempts a LightGBM regressor first; falls back to historical
    slot-level averages if LightGBM is unavailable.

    Attaches predicted_next_window and all_predictions to each hotspot dict.

    Args:
        df_clustered (pd.DataFrame): Clustered data with date info.
        hotspots (list[dict]): Scored hotspots from step3.

    Returns:
        list[dict]: Same hotspot dicts with prediction fields added.
    """
    print("\n" + "=" * 70)
    print("STEP 4 - FORECASTING MODEL")
    print("=" * 70)

    # Build training data: violation count per (cluster, day_of_week, day_part)
    agg = (
        df_clustered.groupby(["cluster", "day_of_week", "day_part", "date"])
        .size()
        .reset_index(name="count")
    )

    # Compute historical averages per slot
    slot_avg = (
        agg.groupby(["cluster", "day_of_week", "day_part"])["count"]
        .mean()
        .reset_index(name="hist_avg")
    )

    # For each hotspot, predict next window using historical averages
    # This is the reliable, explainable approach
    day_parts_order = ["morning", "midday", "evening", "night"]

    # Try GBT model
    try:
        import lightgbm as lgb

        # Encode day_part
        dp_map = {"morning": 0, "midday": 1, "evening": 2, "night": 3}
        agg["dp_encoded"] = agg["day_part"].map(dp_map)

        # Merge historical average as feature
        agg = agg.merge(slot_avg, on=["cluster", "day_of_week", "day_part"], how="left")
        agg["hist_avg"] = agg["hist_avg"].fillna(0)

        features = ["cluster", "day_of_week", "dp_encoded", "hist_avg"]
        X = agg[features].values
        y = agg["count"].values

        # Simple train (use all data since we need predictions for all slots)
        model = lgb.LGBMRegressor(
            n_estimators=100, max_depth=5, learning_rate=0.1,
            min_child_samples=5, verbose=-1, n_jobs=-1,
            random_state=42
        )
        model.fit(X, y)

        # Predict for each hotspot × day_of_week × day_part
        predictions = {}
        for h in hotspots:
            cid = h["id"]
            preds = {}
            for dow in range(7):
                for dp_name, dp_code in dp_map.items():
                    ha = slot_avg[
                        (slot_avg["cluster"] == cid) &
                        (slot_avg["day_of_week"] == dow) &
                        (slot_avg["day_part"] == dp_name)
                    ]["hist_avg"]
                    ha_val = ha.iloc[0] if len(ha) > 0 else 0

                    pred = model.predict([[cid, dow, dp_code, ha_val]])[0]
                    pred = max(0, round(pred, 1))
                    preds[f"{dow}_{dp_name}"] = pred

            # Next window: use current day of week + evening (common demo time)
            import datetime
            now = datetime.datetime.now()
            current_dow = now.weekday()
            next_dp = "evening"  # Default for demo
            next_pred = preds.get(f"{current_dow}_{next_dp}", 0)

            predictions[cid] = {
                "all_predictions": preds,
                "next_window_dow": current_dow,
                "next_window_daypart": next_dp,
                "next_window_predicted": round(next_pred, 1),
            }

        print(f"  LightGBM model trained successfully")
        print(f"  Feature importances: {dict(zip(features, model.feature_importances_))}")

    except Exception as e:
        print(f"  LightGBM failed ({e}), falling back to historical averages")
        predictions = {}
        import datetime
        now = datetime.datetime.now()
        current_dow = now.weekday()

        for h in hotspots:
            cid = h["id"]
            sa = slot_avg[slot_avg["cluster"] == cid]
            preds = {}
            for _, row in sa.iterrows():
                key = f"{int(row['day_of_week'])}_{row['day_part']}"
                preds[key] = round(row["hist_avg"], 1)

            next_pred = preds.get(f"{current_dow}_evening", 0)
            predictions[cid] = {
                "all_predictions": preds,
                "next_window_dow": current_dow,
                "next_window_daypart": "evening",
                "next_window_predicted": round(next_pred, 1),
            }

    # Attach predictions to hotspots
    for h in hotspots:
        pred = predictions.get(h["id"], {})
        h["predicted_next_window"] = pred.get("next_window_predicted", 0)
        h["next_window_daypart"] = pred.get("next_window_daypart", "evening")
        h["all_predictions"] = pred.get("all_predictions", {})

    print(f"  Predictions generated for {len(predictions)} hotspots")

    return hotspots


# ===================================================================
# STEP 5 - ENFORCEMENT WORKLIST
# ===================================================================
def step5_worklist(hotspots, top_n=15):
    """Generate the enforcement priority worklist with context-sensitive AI reasoning.

    Priority = 0.5×(score_norm) + 0.35×(prediction_norm) + 0.15×(recurrence).

    Each entry includes a natural-language 'reason' field that reads like a
    real analyst briefing, citing specific metrics (spike %, peak times,
    landmark proximity, vehicle mix) rather than generic labels.

    Also computes a multi-factor 'recommended_officers' value per hotspot
    based on area coverage, vehicle mix complexity, and historical volume.

    Args:
        hotspots (list[dict]): Hotspots with scores and predictions.
        top_n (int): Number of entries for the worklist. Default 15.

    Returns:
        list[dict]: Worklist entries with rank, priority_score, ai_reason, and
                    recommended_officers.
    """
    print("\n" + "=" * 70)
    print("STEP 5 - ENFORCEMENT WORKLIST (Enhanced AI Reasoning)")
    print("=" * 70)

    DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    SHIFT_LABELS = {
        "morning": "morning (08:00–11:00)",
        "midday": "midday (11:00–16:00)",
        "evening": "evening (17:00–21:00)",
        "night": "late night (21:00–06:00)",
    }
    SHIFT_DEPLOY_TIMES = {
        "morning": "08:30 AM",
        "midday": "11:30 AM",
        "evening": "05:00 PM",
        "night": "09:30 PM",
    }

    # --- Officer requirement factors per vehicle type ---
    # Trucks/heavy vehicles need tow capability (more manpower),
    # scooters can be handled by a single officer.
    VEHICLE_OFFICER_FACTOR = {
        "HEAVY": 1.5,    # needs tow truck coordination
        "LCV": 1.2,
        "CAR": 1.0,
        "AUTO": 0.8,
        "TWO_WHEELER": 0.5,  # single officer can handle multiple
        "OTHER": 0.7,
    }

    # Normalize score and predicted volume
    max_score = max(h["impact_score"] for h in hotspots) if hotspots else 1
    max_pred = max(h.get("predicted_next_window", 1) for h in hotspots) if hotspots else 1
    max_pred = max(max_pred, 1)

    # Compute global average violations/week for spike comparison
    all_vpw = [h["violations_per_week"] for h in hotspots if h["violations_per_week"] > 0]
    global_avg_vpw = np.mean(all_vpw) if all_vpw else 1

    for h in hotspots:
        score_norm = h["impact_score"] / max_score
        pred_norm = h.get("predicted_next_window", 0) / max_pred
        recurrence = h["distinct_weeks"] / 22  # ~22 weeks in 5 months

        priority = 0.5 * score_norm + 0.35 * pred_norm + 0.15 * recurrence
        h["priority_score"] = round(priority * 100, 1)

    # Re-sort by priority
    hotspots.sort(key=lambda h: h["priority_score"], reverse=True)
    for i, h in enumerate(hotspots):
        h["rank"] = i + 1

    # --- Generate context-sensitive AI reasoning + smart officer count ---
    worklist = []
    for h in hotspots[:top_n]:
        # ---- Build context-aware reason string ----
        location_label = h.get("nearest_landmark") or h["location_name"].split(",")[0]

        # 1. Spike analysis: how much worse is this hotspot vs city average?
        spike_pct = round(((h["violations_per_week"] / max(global_avg_vpw, 0.1)) - 1) * 100)

        # 2. Peak day analysis
        dow_dist = h.get("day_of_week_distribution", {})
        if dow_dist:
            peak_dow_key = max(dow_dist, key=lambda k: dow_dist[k])
            peak_dow_idx = int(float(peak_dow_key))
            peak_dow_name = DAY_NAMES[peak_dow_idx] if 0 <= peak_dow_idx <= 6 else "weekdays"
            peak_dow_count = dow_dist[peak_dow_key]
            avg_dow_count = sum(dow_dist.values()) / max(len(dow_dist), 1)
            dow_spike = round(((peak_dow_count / max(avg_dow_count, 1)) - 1) * 100)
        else:
            peak_dow_name = "weekdays"
            dow_spike = 0

        # 3. Peak time-of-day
        dp_dist = h.get("day_part_distribution", {})
        best_shift = max(dp_dist, key=dp_dist.get) if dp_dist else "evening"
        shift_label = SHIFT_LABELS.get(best_shift, best_shift)
        deploy_time = SHIFT_DEPLOY_TIMES.get(best_shift, "08:30 AM")

        # 4. Proximity context
        near_landmark = ""
        if h.get("nearest_landmark_dist_m", 9999) < 500:
            near_landmark = f" near {h['nearest_landmark']}"
        elif h.get("nearest_landmark_dist_m", 9999) < 1000:
            near_landmark = f" within 1 km of {h['nearest_landmark']}"

        # 5. Vehicle mix insight
        veh_dist = h.get("vehicle_distribution", {})
        if veh_dist:
            dominant_veh = max(veh_dist, key=veh_dist.get)
            veh_labels = {"TWO_WHEELER": "two-wheelers", "CAR": "cars", "HEAVY": "heavy vehicles",
                          "LCV": "light commercial vehicles", "AUTO": "autos", "OTHER": "mixed vehicles"}
            veh_insight = veh_labels.get(dominant_veh, dominant_veh.lower())
            veh_pct = round(veh_dist[dominant_veh] / max(sum(veh_dist.values()), 1) * 100)
        else:
            veh_insight = "mixed vehicles"
            veh_pct = 0

        # 6. Recurrence pattern
        recurrence_pct = round(h["distinct_weeks"] / 22 * 100)

        # ---- Multi-factor officer recommendation ----
        # Base: 2 officers per hotspot
        base_officers = 2

        # Factor A: Volume-based scaling (log scale to prevent runaway)
        volume_factor = min(np.log1p(h["violations_per_week"]) / np.log1p(50), 2.0)

        # Factor B: Vehicle complexity — heavy vehicles need more manpower
        if veh_dist:
            total_veh = sum(veh_dist.values())
            complexity = sum(
                VEHICLE_OFFICER_FACTOR.get(cat, 0.7) * (cnt / max(total_veh, 1))
                for cat, cnt in veh_dist.items()
            )
        else:
            complexity = 0.8

        # Factor C: Historical compliance proxy (hotspots that persist
        # across many weeks are harder to enforce — need more officers)
        compliance_difficulty = min(recurrence_pct / 100, 1.0)

        smart_officers = round(base_officers + (volume_factor * complexity * 2) + compliance_difficulty)
        smart_officers = max(2, min(smart_officers, 8))  # clamp 2–8

        # ---- Assemble the AI reasoning sentence ----
        reason_parts = []

        # Opening: spike context
        if spike_pct > 100:
            reason_parts.append(
                f"This hotspot{near_landmark} shows {spike_pct}% higher violation density than the city average"
            )
        elif spike_pct > 0:
            reason_parts.append(
                f"Violation density at this location{near_landmark} is {spike_pct}% above the city average"
            )
        else:
            reason_parts.append(
                f"Active enforcement zone{near_landmark}"
            )

        # Day + time pattern
        if dow_spike > 30:
            reason_parts.append(
                f"with {dow_spike}% spikes on {peak_dow_name} {shift_label}"
            )
        else:
            reason_parts.append(
                f"peaking during {shift_label}"
            )

        # Vehicle insight
        if veh_pct >= 50:
            reason_parts.append(f"driven primarily by {veh_insight} ({veh_pct}%)")

        # Recurrence
        if recurrence_pct >= 80:
            reason_parts.append("chronic recurring zone")

        # Action recommendation
        reason_parts.append(
            f"— deploy {smart_officers} officers at {deploy_time}"
        )

        ai_reason = ", ".join(reason_parts[:3]) + " " + reason_parts[-1] + "."

        # Legacy short reason for backward compat
        short_parts = []
        if h["nearest_landmark_dist_m"] < 1000:
            short_parts.append(f"Near {h['nearest_landmark']}")
        short_parts.append(h["police_station"])
        short_parts.append(f"{best_shift} peak")
        short_parts.append(f"{h['violations_per_week']:.0f} violations/week")
        short_reason = " · ".join(short_parts)

        worklist.append({
            "rank": h["rank"],
            "hotspot_id": h["id"],
            "priority_score": h["priority_score"],
            "impact_score": h["impact_score"],
            "predicted_count": h.get("predicted_next_window", 0),
            "violations_per_week": h["violations_per_week"],
            "location": h["location_name"],
            "police_station": h["police_station"],
            "dominant_violation": h["dominant_violation"],
            "dominant_vehicle": h["dominant_vehicle"],
            "reason": short_reason,
            "ai_reason": ai_reason,
            "recommended_officers": smart_officers,
            "peak_day": peak_dow_name,
            "peak_shift": best_shift,
            "deploy_time": deploy_time,
            "spike_vs_avg_pct": spike_pct,
            "recurrence_pct": recurrence_pct,
            "vehicle_complexity": round(complexity, 2),
            "centroid_lat": h["centroid_lat"],
            "centroid_lng": h["centroid_lng"],
            "next_daypart": h.get("next_window_daypart", "evening"),
        })

    print(f"  Worklist generated: {len(worklist)} entries")
    for w in worklist[:5]:
        print(f"    #{w['rank']}  Priority={w['priority_score']:.1f}  Officers={w['recommended_officers']}")
        print(f"           {w['ai_reason'][:100]}...")

    return worklist


# ===================================================================
# STEP 6 - LAYER 4: ENFORCEMENT INTELLIGENCE
# ===================================================================
def step6_enforcement(hotspots, worklist, default_officers=30):
    """Generate enforcement intelligence: deployments, simulations, ROI, shift plans.

    Sub-modules:
      6a: Officer Deployment Optimizer — allocates officers weighted by impact×prediction.
      6b: Before/After Simulation — estimates capacity recovery at 60% violation reduction.
      6c: Enforcement ROI — improvement-per-officer metric.
      6d: Shift Planner — greedy nearest-neighbor routing for morning/evening shifts.

    Args:
        hotspots (list[dict]): Scored, predicted hotspot dicts.
        worklist (list[dict]): Priority worklist from step5.
        default_officers (int): Total available officers. Default 30.

    Returns:
        dict: Contains 'deployments', 'simulations', 'roi', 'shift_plan', and summary stats.
    """
    print("\n" + "=" * 70)
    print("STEP 6 - ENFORCEMENT INTELLIGENCE ENGINE")
    print("=" * 70)

    # --- 6a: Multi-Factor Officer Deployment Optimizer ---
    # Uses smart officer counts from worklist when available,
    # falls back to impact×prediction weighted allocation.
    top_hotspots = [h for h in hotspots if h["rank"] <= 15]

    # Build a lookup for worklist-computed smart officer counts
    worklist_officers = {w["hotspot_id"]: w.get("recommended_officers", 2) for w in worklist}

    deployments = []
    remaining_officers = default_officers
    for h in top_hotspots:
        # Use the multi-factor recommendation from step5 if available
        smart_count = worklist_officers.get(h["id"], 2)
        allocated = min(smart_count, remaining_officers)
        allocated = max(allocated, 1)  # at least 1 officer
        remaining_officers -= allocated
        if remaining_officers < 0:
            allocated += remaining_officers
            remaining_officers = 0

        # Determine best shift
        dp_dist = h.get("day_part_distribution", {})
        best_shift = max(dp_dist, key=dp_dist.get) if dp_dist else "evening"

        shift_times = {
            "morning": "8:00 AM - 11:00 AM",
            "midday": "11:00 AM - 4:00 PM",
            "evening": "5:00 PM - 9:00 PM",
            "night": "9:00 PM - 6:00 AM",
        }

        # Get the AI-generated reason from worklist
        wl_entry = next((w for w in worklist if w["hotspot_id"] == h["id"]), None)
        ai_reason = wl_entry["ai_reason"] if wl_entry and "ai_reason" in wl_entry else ""
        short_reason = wl_entry["reason"] if wl_entry else ""

        deployments.append({
            "hotspot_id": h["id"],
            "rank": h["rank"],
            "location": h["location_name"],
            "police_station": h["police_station"],
            "officers_allocated": int(allocated),
            "recommended_shift": best_shift,
            "shift_time": shift_times.get(best_shift, "5:00 PM - 9:00 PM"),
            "impact_score": h["impact_score"],
            "predicted_violations": h.get("predicted_next_window", 0),
            "reason": short_reason,
            "ai_reason": ai_reason,
        })

    print(f"  Officer deployments: {len(deployments)}")
    print(f"  Total officers allocated: {sum(d['officers_allocated'] for d in deployments)}")

    # --- 6b: Before/After Simulation ---
    simulations = []
    for h in top_hotspots:
        vpw = h["violations_per_week"]
        vehicle_dist = h.get("vehicle_distribution", {})
        total_vehicles = sum(vehicle_dist.values())

        # Estimate lane blockage (proxy)
        severity_weighted = sum(
            VEHICLE_SEVERITY.get(cat, 0.3) * cnt
            for cat, cnt in vehicle_dist.items()
        )
        capacity_loss = min(round((severity_weighted / max(total_vehicles, 1)) * vpw * 0.8, 1), 95)

        # After enforcement: assume 60% violation reduction
        reduction_factor = 0.60
        after_violations = round(vpw * (1 - reduction_factor), 1)
        recovered_capacity = round(capacity_loss * reduction_factor, 1)
        improvement_pct = round(reduction_factor * 100 * (h["impact_score"] / 100), 1)

        simulations.append({
            "hotspot_id": h["id"],
            "location": h["location_name"],
            "police_station": h["police_station"],
            "before": {
                "illegal_vehicles_per_week": round(vpw),
                "estimated_capacity_loss_pct": round(capacity_loss, 1),
                "impact_score": h["impact_score"],
                "dominant_violation": h["dominant_violation"],
            },
            "after": {
                "expected_violations_per_week": round(after_violations),
                "recovered_capacity_pct": round(recovered_capacity, 1),
                "estimated_improvement_pct": round(improvement_pct, 1),
            },
        })

    # --- 6c: Enforcement ROI ---
    roi_list = []
    for d in deployments:
        officers = d["officers_allocated"]
        sim = next((s for s in simulations if s["hotspot_id"] == d["hotspot_id"]), None)
        if sim and officers > 0:
            improvement = sim["after"]["estimated_improvement_pct"]
            roi = round(improvement / officers, 2)
            violations_prevented = round(
                sim["before"]["illegal_vehicles_per_week"] * 0.6
            )
            hours_saved = round(violations_prevented * 0.12, 1)  # proxy: 0.12 hours per violation prevented
        else:
            roi = 0
            violations_prevented = 0
            hours_saved = 0

        roi_list.append({
            "hotspot_id": d["hotspot_id"],
            "location": d["location"],
            "officers": officers,
            "roi": roi,
            "violations_prevented_per_week": violations_prevented,
            "congestion_improvement_pct": sim["after"]["estimated_improvement_pct"] if sim else 0,
            "hours_saved_daily": hours_saved,
        })

    roi_list.sort(key=lambda r: r["roi"], reverse=True)

    # --- 6d: Shift Planner ---
    morning_hotspots = [d for d in deployments if d["recommended_shift"] == "morning"]
    evening_hotspots = [d for d in deployments if d["recommended_shift"] == "evening"]
    other_hotspots = [d for d in deployments if d["recommended_shift"] not in ("morning", "evening")]

    # Simple greedy nearest-neighbor route for each shift
    def greedy_route(deploy_list, all_hotspots):
        if not deploy_list:
            return []
        route = [deploy_list[0]]
        remaining = list(deploy_list[1:])
        while remaining:
            last = route[-1]
            last_h = next((h for h in all_hotspots if h["id"] == last["hotspot_id"]), None)
            if not last_h:
                route.append(remaining.pop(0))
                continue
            best_idx = 0
            best_dist = float("inf")
            for i, r in enumerate(remaining):
                r_h = next((h for h in all_hotspots if h["id"] == r["hotspot_id"]), None)
                if r_h:
                    d = haversine(last_h["centroid_lat"], last_h["centroid_lng"],
                                  r_h["centroid_lat"], r_h["centroid_lng"])
                    if d < best_dist:
                        best_dist = d
                        best_idx = i
            route.append(remaining.pop(best_idx))
        return route

    morning_route = greedy_route(morning_hotspots, hotspots)
    evening_route = greedy_route(evening_hotspots, hotspots)

    shift_plan = {
        "morning": {
            "time": "8:00 AM - 11:00 AM",
            "hotspots": [{"rank": d["rank"], "location": d["location"],
                          "police_station": d["police_station"],
                          "officers": d["officers_allocated"]}
                         for d in morning_route],
            "patrol_route": " -> ".join(d["police_station"] for d in morning_route) if morning_route else "N/A",
        },
        "evening": {
            "time": "5:00 PM - 9:00 PM",
            "hotspots": [{"rank": d["rank"], "location": d["location"],
                          "police_station": d["police_station"],
                          "officers": d["officers_allocated"]}
                         for d in evening_route],
            "patrol_route": " -> ".join(d["police_station"] for d in evening_route) if evening_route else "N/A",
        },
        "other": {
            "time": "Various",
            "hotspots": [{"rank": d["rank"], "location": d["location"],
                          "police_station": d["police_station"],
                          "officers": d["officers_allocated"]}
                         for d in other_hotspots],
        },
    }

    deployment_data = {
        "default_officers": default_officers,
        "deployments": deployments,
        "roi": roi_list,
        "shift_plan": shift_plan,
    }

    print(f"  Simulations generated: {len(simulations)}")
    print(f"  ROI rankings generated: {len(roi_list)}")
    if roi_list:
        print(f"  Best ROI: {roi_list[0]['location']} = {roi_list[0]['roi']}")

    return deployment_data, simulations


# ===================================================================
# STEP 7 - EXECUTIVE SUMMARY
# ===================================================================
def step7_summary(df, hotspots, worklist, deployment_data, simulations):
    print("\n" + "=" * 70)
    print("STEP 7 - EXECUTIVE COMMAND SUMMARY")
    print("=" * 70)

    total_violations = len(df)
    total_hotspots = len(hotspots)

    # Top 10 zones' share of total impact
    top10_violations = sum(h["violation_count"] for h in hotspots[:10])
    total_clustered = sum(h["violation_count"] for h in hotspots)
    top10_share = round(top10_violations / max(total_clustered, 1) * 100, 1)

    # Average improvement
    avg_improvement = round(
        np.mean([s["after"]["estimated_improvement_pct"] for s in simulations]) if simulations else 0, 1
    )

    total_officers = sum(d["officers_allocated"] for d in deployment_data["deployments"])
    total_violations_prevented = sum(r["violations_prevented_per_week"] for r in deployment_data["roi"])

    summary = {
        "total_violations_analyzed": int(total_violations),
        "total_hotspots_detected": int(total_hotspots),
        "top_10_zones_impact_share_pct": top10_share,
        "recommended_officers": int(total_officers),
        "projected_improvement_pct": avg_improvement,
        "total_violations_prevented_weekly": int(total_violations_prevented),
        "date_range": {
            "start": str(df["created_ist"].min().date()),
            "end": str(df["created_ist"].max().date()),
        },
        "top_stations": df["police_station"].value_counts().head(5).to_dict(),
        "top_violation_types": df["primary_violation"].value_counts().head(5).to_dict(),
        "vehicle_category_distribution": df["vehicle_category"].value_counts().to_dict(),
        "hotspot_score_stats": {
            "max": max(h["impact_score"] for h in hotspots),
            "min": min(h["impact_score"] for h in hotspots),
            "mean": round(np.mean([h["impact_score"] for h in hotspots]), 1),
            "median": round(np.median([h["impact_score"] for h in hotspots]), 1),
        },
    }

    print(f"  Total violations analyzed: {summary['total_violations_analyzed']:,}")
    print(f"  Hotspots detected: {summary['total_hotspots_detected']}")
    print(f"  Top 10 zones' impact share: {summary['top_10_zones_impact_share_pct']}%")
    print(f"  Recommended officer deployment: {summary['recommended_officers']}")
    print(f"  Projected congestion improvement: {summary['projected_improvement_pct']}%")

    return summary


# ===================================================================
# STEP 8 - BUILD TREND DATA FOR CHARTS
# ===================================================================
def step8_trends(df_clustered, hotspots):
    print("\n" + "=" * 70)
    print("STEP 8 - BUILDING TREND DATA")
    print("=" * 70)

    trends = {}
    for h in hotspots:
        cid = h["id"]
        cdf = df_clustered[df_clustered["cluster"] == cid]

        # Weekly trend
        weekly = cdf.groupby("week").size().reset_index(name="count")
        weekly_data = [{"week": int(w), "count": int(c)} for w, c in zip(weekly["week"], weekly["count"])]

        # Hourly distribution for the hotspot
        hourly = cdf["hour"].value_counts().sort_index()
        hourly_data = {str(k): int(v) for k, v in hourly.items()}

        # Day-of-week distribution
        dow = cdf["day_of_week"].value_counts().sort_index()
        dow_data = {str(k): int(v) for k, v in dow.items()}

        # Monthly
        monthly = cdf["month"].value_counts().sort_index()
        monthly_data = {str(k): int(v) for k, v in monthly.items()}

        trends[str(cid)] = {
            "weekly": weekly_data,
            "hourly": hourly_data,
            "day_of_week": dow_data,
            "monthly": monthly_data,
        }

    print(f"  Trend data built for {len(trends)} hotspots")
    return trends


# ===================================================================
# MAIN
# ===================================================================
def main():
    print("=" * 60)
    print("LITTLECAM - OFFLINE DATA PROCESSING PIPELINE")
    print("=" * 60)
    print(f"Input: {RAW_CSV}")
    print(f"Output: {OUT_DIR}")

    # Step 1
    df = step1_clean(RAW_CSV)

    # Compute total weeks in data
    date_range = (df["created_ist"].max() - df["created_ist"].min()).days
    total_weeks = max(date_range / 7, 1)
    print(f"\n  Total weeks span: {total_weeks:.1f}")

    # Step 2
    df_clustered, n_clusters = step2_cluster(df)

    # Step 3
    hotspots = step3_score(df_clustered, total_weeks)

    # Step 4
    hotspots = step4_forecast(df_clustered, hotspots)

    # Step 5
    worklist = step5_worklist(hotspots)

    # Step 6
    deployment_data, simulations = step6_enforcement(hotspots, worklist)

    # Step 7
    summary = step7_summary(df, hotspots, worklist, deployment_data, simulations)

    # Step 8
    trends = step8_trends(df_clustered, hotspots)

    # ===== WRITE OUTPUTS =====
    print("\n" + "=" * 70)
    print("WRITING OUTPUT FILES")
    print("=" * 70)

    def write_json(filename, data):
        path = os.path.join(OUT_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=safe_json, ensure_ascii=False)
        size_kb = os.path.getsize(path) / 1024
        print(f"  [OK] {filename} ({size_kb:.1f} KB)")

    write_json("hotspots.json", hotspots)
    write_json("worklist.json", worklist)
    write_json("deployment.json", deployment_data)
    write_json("simulation.json", simulations)
    write_json("summary.json", summary)
    write_json("trends.json", trends)

    print("\n" + "=" * 70)
    print("PIPELINE COMPLETE")
    print("=" * 70)
    print(f"  {len(hotspots)} hotspots processed")
    print(f"  {len(worklist)} worklist entries")
    print(f"  6 JSON files written to {OUT_DIR}")
    print("  Ready for frontend consumption.")


if __name__ == "__main__":
    main()
