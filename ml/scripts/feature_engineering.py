"""
feature_engineering.py

Reads merged CSVs from ml/data/processed/{league}_all.csv and computes
25+ features per team per season, saving to ml/data/processed/features_{league}.csv

Run from the ml/ directory:
    python scripts/feature_engineering.py
"""

import os
import numpy as np
import pandas as pd
from tqdm import tqdm

LEAGUES = ["E0", "SP1", "I1", "D1", "F1"]

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

ELO_K = 32
ELO_START = 1500


def expected_score(rating_a, rating_b):
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))


def get_col(df, col, default=0):
    """Return df[col] if it exists, else a Series of `default`."""
    if col in df.columns:
        return df[col]
    return pd.Series(default, index=df.index)


def compute_elo_ratings(df):
    """
    Compute ELO ratings for every team across all matches in df.
    Returns a dict: {(HomeTeam, match_index): home_elo_before,
                     (AwayTeam, match_index): away_elo_before}
    and a dict {team: final_elo}.
    """
    elo = {}
    home_elo_before = {}
    away_elo_before = {}

    for idx, row in df.iterrows():
        home = row["HomeTeam"]
        away = row["AwayTeam"]
        result = row.get("FTR", None)

        r_home = elo.get(home, ELO_START)
        r_away = elo.get(away, ELO_START)

        home_elo_before[idx] = r_home
        away_elo_before[idx] = r_away

        if result == "H":
            s_home, s_away = 1, 0
        elif result == "D":
            s_home, s_away = 0.5, 0.5
        elif result == "A":
            s_home, s_away = 0, 1
        else:
            continue

        e_home = expected_score(r_home, r_away)
        e_away = expected_score(r_away, r_home)

        elo[home] = r_home + ELO_K * (s_home - e_home)
        elo[away] = r_away + ELO_K * (s_away - e_away)

    return home_elo_before, away_elo_before, elo


def compute_form_last5(match_results):
    """
    Given a list of results ('W', 'D', 'L') in chronological order,
    return points from the last 5 matches (3=W, 1=D, 0=L).
    If fewer than 5, use all available.
    """
    last5 = match_results[-5:]
    pts = sum(3 if r == "W" else 1 if r == "D" else 0 for r in last5)
    return pts


def process_team_season(team, season_df, home_elo_before, away_elo_before):
    """
    Compute all features for a single (team, season) combination.
    season_df: rows where team is HomeTeam or AwayTeam, sorted by Date.
    Returns a dict of features.
    """
    home_mask = season_df["HomeTeam"] == team
    away_mask = season_df["AwayTeam"] == team

    home_df = season_df[home_mask]
    away_df = season_df[away_mask]

    total = len(season_df)
    if total == 0:
        return None

    ftr = season_df.get("FTR", pd.Series(dtype=str)) if "FTR" in season_df.columns else pd.Series(dtype=str)

    # ---- Results ----
    home_results = []
    for _, r in home_df.iterrows():
        res = r.get("FTR", None)
        if res == "H":
            home_results.append("W")
        elif res == "D":
            home_results.append("D")
        elif res == "A":
            home_results.append("L")

    away_results = []
    for _, r in away_df.iterrows():
        res = r.get("FTR", None)
        if res == "A":
            away_results.append("W")
        elif res == "D":
            away_results.append("D")
        elif res == "H":
            away_results.append("L")

    all_results_ordered = []
    all_dates = []

    for idx, r in home_df.iterrows():
        all_dates.append((r.get("Date", pd.NaT), "H", idx, r))
    for idx, r in away_df.iterrows():
        all_dates.append((r.get("Date", pd.NaT), "A", idx, r))

    all_dates.sort(key=lambda x: (pd.NaT if pd.isnull(x[0]) else x[0]))

    for date, side, idx, r in all_dates:
        res = r.get("FTR", None)
        if side == "H":
            if res == "H":
                all_results_ordered.append("W")
            elif res == "D":
                all_results_ordered.append("D")
            elif res == "A":
                all_results_ordered.append("L")
        else:
            if res == "A":
                all_results_ordered.append("W")
            elif res == "D":
                all_results_ordered.append("D")
            elif res == "H":
                all_results_ordered.append("L")

    wins = all_results_ordered.count("W")
    draws = all_results_ordered.count("D")
    losses = all_results_ordered.count("L")
    matches_played = total

    win_rate = wins / total if total else 0
    draw_rate = draws / total if total else 0
    loss_rate = losses / total if total else 0

    home_wins = home_results.count("W")
    home_matches = len(home_results)
    away_wins = away_results.count("W")
    away_matches = len(away_results)

    home_win_rate = home_wins / home_matches if home_matches else 0
    away_win_rate = away_wins / away_matches if away_matches else 0

    # ---- Goals scored / conceded ----
    fthg = get_col(season_df, "FTHG")
    ftag = get_col(season_df, "FTAG")

    goals_scored_home = fthg[home_mask].sum()
    goals_scored_away = ftag[away_mask].sum()
    goals_conceded_home = ftag[home_mask].sum()
    goals_conceded_away = fthg[away_mask].sum()

    total_scored = goals_scored_home + goals_scored_away
    total_conceded = goals_conceded_home + goals_conceded_away

    goals_scored_avg = total_scored / total if total else 0
    goals_conceded_avg = total_conceded / total if total else 0
    goal_difference_avg = (total_scored - total_conceded) / total if total else 0

    home_goals_avg = goals_scored_home / home_matches if home_matches else 0
    away_goals_avg = goals_scored_away / away_matches if away_matches else 0
    conceded_home_avg = goals_conceded_home / home_matches if home_matches else 0
    conceded_away_avg = goals_conceded_away / away_matches if away_matches else 0

    # ---- Shots ----
    hs = get_col(season_df, "HS")
    as_ = get_col(season_df, "AS")
    hst = get_col(season_df, "HST")
    ast = get_col(season_df, "AST")

    shots_total = hs[home_mask].sum() + as_[away_mask].sum()
    shots_on_target_total = hst[home_mask].sum() + ast[away_mask].sum()

    shots_avg = shots_total / total if total else 0
    shots_on_target_avg = shots_on_target_total / total if total else 0
    shot_accuracy = (shots_on_target_total / shots_total) if shots_total > 0 else 0

    xg_proxy = shots_on_target_avg * 0.3

    # ---- Clean sheets ----
    clean_home = (ftag[home_mask] == 0).sum()
    clean_away = (fthg[away_mask] == 0).sum()
    clean_sheets = clean_home + clean_away
    clean_sheet_rate = clean_sheets / total if total else 0

    # ---- Points ----
    points_total = wins * 3 + draws * 1
    points_avg_per_game = points_total / total if total else 0

    # ---- Form last 5 ----
    form_last5 = compute_form_last5(all_results_ordered)

    # ---- ELO ----
    elo_values = []
    for idx, r in home_df.iterrows():
        if idx in home_elo_before:
            elo_values.append(home_elo_before[idx])
    for idx, r in away_df.iterrows():
        if idx in away_elo_before:
            elo_values.append(away_elo_before[idx])
    elo_rating = np.mean(elo_values) if elo_values else ELO_START

    # ---- Big win rate (win by 2+ goals) ----
    big_wins = 0
    for _, r in home_df.iterrows():
        hg = r.get("FTHG", 0) if "FTHG" in season_df.columns else 0
        ag = r.get("FTAG", 0) if "FTAG" in season_df.columns else 0
        if r.get("FTR", None) == "H" and (hg - ag) >= 2:
            big_wins += 1
    for _, r in away_df.iterrows():
        hg = r.get("FTHG", 0) if "FTHG" in season_df.columns else 0
        ag = r.get("FTAG", 0) if "FTAG" in season_df.columns else 0
        if r.get("FTR", None) == "A" and (ag - hg) >= 2:
            big_wins += 1
    big_win_rate = big_wins / total if total else 0

    # ---- Comeback rate ----
    # Proxy: team wins despite conceding first goal.
    # We don't have goal-by-goal data, so we use half-time scores if available (HTR/HTHG/HTAG).
    # If half-time not available, set to NaN.
    comeback_rate = np.nan
    if "HTHG" in season_df.columns and "HTAG" in season_df.columns:
        comebacks = 0
        eligible = 0
        for _, r in home_df.iterrows():
            ht_h = r.get("HTHG", np.nan)
            ht_a = r.get("HTAG", np.nan)
            ft_res = r.get("FTR", None)
            if pd.notnull(ht_h) and pd.notnull(ht_a):
                if ht_h < ht_a:  # behind at half time
                    eligible += 1
                    if ft_res == "H":
                        comebacks += 1
        for _, r in away_df.iterrows():
            ht_h = r.get("HTHG", np.nan)
            ht_a = r.get("HTAG", np.nan)
            ft_res = r.get("FTR", None)
            if pd.notnull(ht_h) and pd.notnull(ht_a):
                if ht_a < ht_h:  # away team behind at half time
                    eligible += 1
                    if ft_res == "A":
                        comebacks += 1
        comeback_rate = comebacks / eligible if eligible > 0 else 0.0

    # ---- Scoring consistency (std dev of goals scored per match) ----
    goals_per_match = []
    for _, r in home_df.iterrows():
        goals_per_match.append(r.get("FTHG", 0) if "FTHG" in season_df.columns else 0)
    for _, r in away_df.iterrows():
        goals_per_match.append(r.get("FTAG", 0) if "FTAG" in season_df.columns else 0)
    scoring_consistency = np.std(goals_per_match) if goals_per_match else 0.0

    # ---- Defensive consistency (std dev of goals conceded per match) ----
    conceded_per_match = []
    for _, r in home_df.iterrows():
        conceded_per_match.append(r.get("FTAG", 0) if "FTAG" in season_df.columns else 0)
    for _, r in away_df.iterrows():
        conceded_per_match.append(r.get("FTHG", 0) if "FTHG" in season_df.columns else 0)
    defensive_consistency = np.std(conceded_per_match) if conceded_per_match else 0.0

    return {
        "matches_played": matches_played,
        "win_rate": win_rate,
        "draw_rate": draw_rate,
        "loss_rate": loss_rate,
        "home_win_rate": home_win_rate,
        "away_win_rate": away_win_rate,
        "goals_scored_avg": goals_scored_avg,
        "goals_conceded_avg": goals_conceded_avg,
        "goal_difference_avg": goal_difference_avg,
        "home_goals_avg": home_goals_avg,
        "away_goals_avg": away_goals_avg,
        "conceded_home_avg": conceded_home_avg,
        "conceded_away_avg": conceded_away_avg,
        "shots_avg": shots_avg,
        "shots_on_target_avg": shots_on_target_avg,
        "shot_accuracy": shot_accuracy,
        "xg_proxy": xg_proxy,
        "clean_sheet_rate": clean_sheet_rate,
        "form_last5": form_last5,
        "elo_rating": elo_rating,
        "points_total": points_total,
        "points_avg_per_game": points_avg_per_game,
        "big_win_rate": big_win_rate,
        "comeback_rate": comeback_rate,
        "scoring_consistency": scoring_consistency,
        "defensive_consistency": defensive_consistency,
    }


def process_league(league):
    input_path = os.path.join(DATA_DIR, f"{league}_all.csv")
    output_path = os.path.join(DATA_DIR, f"features_{league}.csv")

    if not os.path.exists(input_path):
        print(f"[{league}] File not found: {input_path} — skipping.")
        return

    print(f"\n[{league}] Reading {input_path} ...")
    df = pd.read_csv(input_path, low_memory=False)

    # Parse date
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, errors="coerce")

    # Derive Season if not present
    if "Season" not in df.columns:
        if "Date" in df.columns:
            df["Season"] = df["Date"].dt.year.apply(
                lambda y: f"{y-1}/{str(y)[2:]}" if pd.notnull(y) else "unknown"
            )
        else:
            df["Season"] = "unknown"

    # Sort by date for ELO and form calculations
    if "Date" in df.columns:
        df = df.sort_values("Date").reset_index(drop=True)

    seasons = sorted(df["Season"].dropna().unique())
    records = []

    for season in tqdm(seasons, desc=f"{league} seasons"):
        season_df = df[df["Season"] == season].copy()

        # Compute ELO over this season
        home_elo_before, away_elo_before, final_elo = compute_elo_ratings(season_df)

        teams = set()
        if "HomeTeam" in season_df.columns:
            teams.update(season_df["HomeTeam"].dropna().unique())
        if "AwayTeam" in season_df.columns:
            teams.update(season_df["AwayTeam"].dropna().unique())

        for team in teams:
            team_mask = (
                (season_df.get("HomeTeam", pd.Series(dtype=str)) == team) |
                (season_df.get("AwayTeam", pd.Series(dtype=str)) == team)
            )
            team_season_df = season_df[team_mask].copy()

            features = process_team_season(team, team_season_df, home_elo_before, away_elo_before)
            if features is None:
                continue

            record = {
                "team": team,
                "season": season,
                "league": league,
                **features,
            }
            records.append(record)

    if not records:
        print(f"[{league}] No records produced — check input file.")
        return

    out_df = pd.DataFrame(records)
    out_df.to_csv(output_path, index=False)
    print(f"[{league}] Saved {len(out_df)} rows to {output_path}")


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    for league in LEAGUES:
        process_league(league)
    print("\nDone. All leagues processed.")


if __name__ == "__main__":
    main()
