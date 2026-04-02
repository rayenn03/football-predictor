import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import LabelEncoder
import warnings

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models")

LEAGUES = {
    "E0": {"name": "Premier League", "slug": "premier-league"},
    "SP1": {"name": "La Liga", "slug": "la-liga"},
    "I1": {"name": "Serie A", "slug": "serie-a"},
    "D1": {"name": "Bundesliga", "slug": "bundesliga"},
    "F1": {"name": "Ligue 1", "slug": "ligue-1"},
}

FEATURES = [
    "win_rate",
    "draw_rate",
    "loss_rate",
    "goals_scored_avg",
    "goals_conceded_avg",
    "shot_accuracy",
    "home_win_rate",
    "away_win_rate",
    "clean_sheet_rate",
    "form_last5",
    "elo_rating",
    "goal_difference_avg",
    "points_avg_per_game",
    "big_win_rate",
    "xg_proxy",
]

CURRENT_SEASON = "2425"


def load_features(league: str) -> pd.DataFrame | None:
    path = os.path.join(DATA_DIR, f"features_{league}.csv")
    if not os.path.exists(path):
        print(f"  [WARNING] File not found: {path}")
        return None
    df = pd.read_csv(path)
    print(f"  Loaded {len(df)} rows from {os.path.basename(path)}")
    return df


def build_target(df: pd.DataFrame) -> pd.DataFrame:
    """Add 'champion' column: 1 for the team with highest points_total per season, else 0."""
    if "points_total" not in df.columns or "season" not in df.columns:
        raise ValueError("DataFrame must contain 'points_total' and 'season' columns.")
    df = df.copy()
    df["champion"] = 0
    for season, group in df.groupby("season"):
        max_pts = group["points_total"].max()
        idx = group[group["points_total"] == max_pts].index
        df.loc[idx, "champion"] = 1
    return df


def get_available_features(df: pd.DataFrame) -> list[str]:
    available = [f for f in FEATURES if f in df.columns]
    missing = [f for f in FEATURES if f not in df.columns]
    if missing:
        print(f"  [WARNING] Missing feature columns (will be skipped): {missing}")
    return available


def train_models(X: np.ndarray, y: np.ndarray, league: str):
    rf = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
    gb = GradientBoostingClassifier(
        n_estimators=200, learning_rate=0.05, max_depth=5, random_state=42
    )

    rf.fit(X, y)
    gb.fit(X, y)

    cv_rf = cross_val_score(rf, X, y, cv=5, scoring="accuracy")
    cv_gb = cross_val_score(gb, X, y, cv=5, scoring="accuracy")
    accuracy = float(np.mean([cv_rf.mean(), cv_gb.mean()]))

    print(f"  RF CV accuracy:  {cv_rf.mean():.4f} (+/- {cv_rf.std():.4f})")
    print(f"  GB CV accuracy:  {cv_gb.mean():.4f} (+/- {cv_gb.std():.4f})")
    print(f"  Ensemble accuracy: {accuracy:.4f}")

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(rf, os.path.join(MODELS_DIR, f"rf_model_{league}.joblib"))
    joblib.dump(gb, os.path.join(MODELS_DIR, f"gb_model_{league}.joblib"))
    print(f"  Models saved to {MODELS_DIR}/")

    return rf, gb, accuracy


def predict_current_season(
    df: pd.DataFrame,
    rf: RandomForestClassifier,
    gb: GradientBoostingClassifier,
    features: list[str],
) -> dict:
    current = df[df["season"] == CURRENT_SEASON].copy()

    if current.empty:
        # Fallback: use the most recent season available
        latest = df["season"].max()
        print(
            f"  [WARNING] Season {CURRENT_SEASON} not found. Falling back to {latest}."
        )
        current = df[df["season"] == latest].copy()

    if current.empty:
        print("  [ERROR] No data available for prediction.")
        return {}

    X_cur = current[features].fillna(0).values

    proba_rf = rf.predict_proba(X_cur)
    proba_gb = gb.predict_proba(X_cur)

    # Both classifiers may only have class 0 if no champion in current season data yet
    classes = list(rf.classes_)
    if 1 not in classes:
        # Assign a uniform low probability
        ensemble_proba = np.zeros(len(current))
    else:
        champion_idx = list(rf.classes_).index(1)
        ensemble_proba = (proba_rf[:, champion_idx] + proba_gb[:, champion_idx]) / 2.0

    current = current.copy()
    current["champion_prob"] = ensemble_proba

    current_sorted = current.sort_values("champion_prob", ascending=False).reset_index(
        drop=True
    )

    team_col = _detect_team_column(current_sorted)

    champion_row = current_sorted.iloc[0]
    champion = {
        "team": str(champion_row[team_col]),
        "probability": round(float(champion_row["champion_prob"]), 4),
    }

    top4 = []
    for _, row in current_sorted.head(4).iterrows():
        top4.append(
            {
                "team": str(row[team_col]),
                "probability": round(float(row["champion_prob"]), 4),
            }
        )

    # Top scorer team: highest xg_proxy
    top_scorer_team = _get_top_team_by_col(current_sorted, team_col, "xg_proxy")

    # Top assists team: highest shot_accuracy
    top_assists_team = _get_top_team_by_col(current_sorted, team_col, "shot_accuracy")

    return {
        "champion": champion,
        "top4": top4,
        "top_scorer_team": top_scorer_team,
        "top_assists_team": top_assists_team,
    }


def _detect_team_column(df: pd.DataFrame) -> str:
    for candidate in ["team", "Team", "HomeTeam", "home_team", "squad", "Squad"]:
        if candidate in df.columns:
            return candidate
    raise ValueError(
        f"Cannot find a team name column. Available columns: {list(df.columns)}"
    )


def _get_top_team_by_col(df: pd.DataFrame, team_col: str, col: str) -> str:
    if col not in df.columns:
        return "N/A"
    idx = df[col].idxmax()
    return str(df.loc[idx, team_col])


def process_league(league: str) -> dict | None:
    print(f"\n{'='*60}")
    print(f"Processing league: {league} — {LEAGUES[league]['name']}")
    print(f"{'='*60}")

    df = load_features(league)
    if df is None:
        return None

    try:
        df = build_target(df)
    except ValueError as e:
        print(f"  [ERROR] Cannot build target: {e}")
        return None

    features = get_available_features(df)
    if not features:
        print("  [ERROR] No usable features found.")
        return None

    # Use all seasons for training (including current if available)
    X = df[features].fillna(0).values
    y = df["champion"].values

    # Guard: need at least 2 classes to train meaningfully
    if len(np.unique(y)) < 2:
        print(
            "  [WARNING] Only one class in target — adding synthetic negative sample."
        )
        X = np.vstack([X, np.zeros((1, X.shape[1]))])
        y = np.append(y, 0)

    try:
        rf, gb, accuracy = train_models(X, y, league)
    except Exception as e:
        print(f"  [ERROR] Training failed: {e}")
        return None

    predictions = predict_current_season(df, rf, gb, features)
    if not predictions:
        return None

    result = {
        "name": LEAGUES[league]["name"],
        "slug": LEAGUES[league]["slug"],
        "champion": predictions.get("champion", {}),
        "top4": predictions.get("top4", []),
        "top_scorer_team": predictions.get("top_scorer_team", "N/A"),
        "top_assists_team": predictions.get("top_assists_team", "N/A"),
        "current_season": CURRENT_SEASON,
        "model_accuracy": round(accuracy, 4),
    }

    return result


def save_predictions(all_predictions: dict) -> None:
    os.makedirs(MODELS_DIR, exist_ok=True)
    output = {"leagues": all_predictions}
    output_path = os.path.join(MODELS_DIR, "predictions.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\nPredictions saved to: {output_path}")


def main() -> None:
    print("Football League Winner Prediction — Training Script")
    print(f"Base directory : {BASE_DIR}")
    print(f"Data directory : {DATA_DIR}")
    print(f"Models directory: {MODELS_DIR}")

    all_predictions: dict = {}

    for league in LEAGUES:
        result = process_league(league)
        if result is not None:
            all_predictions[league] = result
        else:
            print(f"  [SKIPPED] {league} — insufficient data or error.")

    if all_predictions:
        save_predictions(all_predictions)
        print("\nSummary:")
        for league, data in all_predictions.items():
            champ = data.get("champion", {})
            print(
                f"  {league:4s} ({data['name']:15s}) — Champion: {champ.get('team', 'N/A'):25s} "
                f"prob={champ.get('probability', 0):.2f}  accuracy={data['model_accuracy']:.4f}"
            )
    else:
        print("\n[ERROR] No leagues were successfully processed. Check your data files.")


if __name__ == "__main__":
    main()
