"""
predict.py — Enhance ML predictions with Gemini AI and generate all 23 trophy predictions.

Run from the ml/ directory:
    python scripts/predict.py
"""

import os
import json
import datetime

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
INPUT_FILE = os.path.join(MODELS_DIR, "predictions.json")
OUTPUT_FILE = os.path.join(MODELS_DIR, "final_predictions.json")

# Load .env from parent directory (football_predict/)
DOTENV_PATH = os.path.join(BASE_DIR, "..", ".env")
load_dotenv(dotenv_path=DOTENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ---------------------------------------------------------------------------
# League slug mapping (codes used in predictions.json → slugs)
# ---------------------------------------------------------------------------
LEAGUE_CODE_TO_SLUG = {
    "E0": "premier-league",
    "SP1": "la-liga",
    "I1": "serie-a",
    "D1": "bundesliga",
    "F1": "ligue-1",
}

SLUG_TO_NAME = {
    "premier-league": "Premier League",
    "la-liga": "La Liga",
    "serie-a": "Serie A",
    "bundesliga": "Bundesliga",
    "ligue-1": "Ligue 1",
}

# ---------------------------------------------------------------------------
# Default plausible player data for 2024/25 season
# ---------------------------------------------------------------------------
DEFAULT_PLAYERS = {
    # Global trophies
    "ballon_dor": {"player": "Vinicius Jr", "team": "Real Madrid", "league": "La Liga", "confidence": 0.42},
    "kopa_trophy": {"player": "Lamine Yamal", "team": "FC Barcelona", "league": "La Liga", "confidence": 0.55},
    "yashin_trophy": {"player": "Emiliano Martinez", "team": "Aston Villa", "league": "Premier League", "confidence": 0.38},
    "gerd_muller_trophy": {"player": "Erling Haaland", "team": "Manchester City", "league": "Premier League", "goals": 27, "confidence": 0.45},
    "european_golden_boot": {"player": "Erling Haaland", "team": "Manchester City", "league": "Premier League", "goals": 27, "confidence": 0.45},

    # Champions League
    "ucl_winner": {"team": "Real Madrid", "league": "La Liga", "probability": 0.28},
    "ucl_runner_up": {"team": "Manchester City", "league": "Premier League", "probability": 0.18},
    "ucl_top_scorer": {"player": "Erling Haaland", "team": "Manchester City"},

    # Premier League
    "pl_golden_boot": {"player": "Erling Haaland", "team": "Manchester City", "goals": 27},
    "pl_playmaker": {"player": "Kevin De Bruyne", "team": "Manchester City", "assists": 16},
    "pl_golden_glove": {"player": "David Raya", "team": "Arsenal", "clean_sheets": 17},

    # La Liga
    "ll_pichichi": {"player": "Kylian Mbappe", "team": "Real Madrid", "goals": 25},
    "ll_zamora": {"player": "Inaki Pena", "team": "FC Barcelona", "goals_conceded_ratio": 0.68},
    "ll_top_assists": {"player": "Lamine Yamal", "team": "FC Barcelona", "assists": 14},

    # Serie A
    "sa_capocannoniere": {"player": "Lautaro Martinez", "team": "Inter Milan", "goals": 22},
    "sa_top_assists": {"player": "Khvicha Kvaratskhelia", "team": "Napoli", "assists": 12},

    # Bundesliga
    "bl_torjaeger": {"player": "Harry Kane", "team": "Bayern Munich", "goals": 29},
    "bl_top_assists": {"player": "Florian Wirtz", "team": "Bayer Leverkusen", "assists": 15},

    # Ligue 1
    "l1_buteur": {"player": "Jonathan David", "team": "LOSC Lille", "goals": 24},
    "l1_top_assists": {"player": "Bradley Barcola", "team": "Paris Saint-Germain", "assists": 13},
}


# ---------------------------------------------------------------------------
# Gemini AI integration
# ---------------------------------------------------------------------------

def get_gemini_model():
    """Initialize and return a Gemini generative model, or None if unavailable."""
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        return model
    except ImportError:
        print("[WARNING] google-generativeai not installed. Skipping Gemini enhancement.")
        return None
    except Exception as e:
        print(f"[WARNING] Gemini initialization failed: {e}")
        return None


def ask_gemini(model, prompt: str) -> str:
    """Send a prompt to Gemini and return the text response."""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"  [Gemini ERROR] {e}")
        return ""


def enhance_champion_with_gemini(model, league_name: str, ml_champion: str, ml_prob: float) -> dict:
    """
    Ask Gemini to confirm or adjust the champion prediction for a given league.
    Returns a dict with 'team' and 'probability', falling back to ML values on failure.
    """
    prompt = (
        f"Based on the 2024/25 football season (which ended or is near its end), "
        f"for the {league_name}, the ML model predicts '{ml_champion}' as champion "
        f"with a probability score of {ml_prob:.2f}. "
        f"Please confirm if this is correct or suggest the most likely champion. "
        f"Reply in this exact JSON format only, no markdown, no extra text:\n"
        f'{{"team": "TeamName", "probability": 0.XX, "reasoning": "short reason"}}'
    )
    raw = ask_gemini(model, prompt)
    if not raw:
        return {"team": ml_champion, "probability": ml_prob}

    # Try to parse JSON from response
    try:
        # Strip possible markdown code fences
        cleaned = raw.strip().strip("```json").strip("```").strip()
        data = json.loads(cleaned)
        team = data.get("team", ml_champion)
        prob = float(data.get("probability", ml_prob))
        prob = max(0.0, min(1.0, prob))
        print(f"    Gemini: {team} (prob={prob:.2f}) — {data.get('reasoning', '')}")
        return {"team": team, "probability": round(prob, 4)}
    except (json.JSONDecodeError, ValueError, KeyError):
        print(f"    [WARNING] Could not parse Gemini response. Using ML prediction.")
        return {"team": ml_champion, "probability": ml_prob}


def enhance_players_with_gemini(model) -> dict:
    """
    Ask Gemini for player-level trophy predictions for 2024/25.
    Returns a dict of overrides, or empty dict on failure.
    """
    prompt = (
        "For the 2024/25 European football season, predict the following trophy winners. "
        "Use real player names that are plausible. Reply ONLY in this exact JSON format, "
        "no markdown, no extra text:\n"
        '{\n'
        '  "ballon_dor": {"player": "...", "team": "...", "league": "..."},\n'
        '  "kopa_trophy": {"player": "...", "team": "...", "league": "..."},\n'
        '  "yashin_trophy": {"player": "...", "team": "...", "league": "..."},\n'
        '  "gerd_muller_trophy": {"player": "...", "team": "...", "league": "...", "goals": 0},\n'
        '  "ucl_winner": {"team": "...", "league": "..."},\n'
        '  "ucl_runner_up": {"team": "...", "league": "..."},\n'
        '  "ucl_top_scorer": {"player": "...", "team": "..."},\n'
        '  "pl_golden_boot": {"player": "...", "team": "...", "goals": 0},\n'
        '  "pl_playmaker": {"player": "...", "team": "...", "assists": 0},\n'
        '  "pl_golden_glove": {"player": "...", "team": "...", "clean_sheets": 0},\n'
        '  "ll_pichichi": {"player": "...", "team": "...", "goals": 0},\n'
        '  "ll_zamora": {"player": "...", "team": "...", "goals_conceded_ratio": 0.0},\n'
        '  "ll_top_assists": {"player": "...", "team": "...", "assists": 0},\n'
        '  "sa_capocannoniere": {"player": "...", "team": "...", "goals": 0},\n'
        '  "sa_top_assists": {"player": "...", "team": "...", "assists": 0},\n'
        '  "bl_torjaeger": {"player": "...", "team": "...", "goals": 0},\n'
        '  "bl_top_assists": {"player": "...", "team": "...", "assists": 0},\n'
        '  "l1_buteur": {"player": "...", "team": "...", "goals": 0},\n'
        '  "l1_top_assists": {"player": "...", "team": "...", "assists": 0}\n'
        '}'
    )
    raw = ask_gemini(model, prompt)
    if not raw:
        return {}

    try:
        cleaned = raw.strip().strip("```json").strip("```").strip()
        data = json.loads(cleaned)
        print("  [Gemini] Player trophy predictions received successfully.")
        return data
    except (json.JSONDecodeError, ValueError):
        print("  [WARNING] Could not parse Gemini player predictions. Using defaults.")
        return {}


# ---------------------------------------------------------------------------
# Load predictions.json
# ---------------------------------------------------------------------------

def load_predictions() -> dict:
    if not os.path.exists(INPUT_FILE):
        print(f"[WARNING] {INPUT_FILE} not found. Using empty league data.")
        return {}
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("leagues", {})


# ---------------------------------------------------------------------------
# Build final predictions
# ---------------------------------------------------------------------------

def build_final_predictions(leagues_raw: dict, model) -> dict:
    """
    Combine ML predictions with Gemini enhancements and default player data
    to produce the full 23-trophy final_predictions.json structure.
    """
    # Convert league codes to slugs for internal use
    leagues_by_slug: dict = {}
    for code, data in leagues_raw.items():
        slug = data.get("slug") or LEAGUE_CODE_TO_SLUG.get(code, code)
        leagues_by_slug[slug] = data

    # Get Gemini player overrides (if model available)
    players = dict(DEFAULT_PLAYERS)
    if model:
        print("\n[Gemini] Fetching player trophy predictions...")
        gemini_players = enhance_players_with_gemini(model)
        for key, val in gemini_players.items():
            if key in players and isinstance(val, dict):
                # Merge: keep defaults for any missing sub-keys
                merged = dict(players[key])
                merged.update(val)
                players[key] = merged

    # Enhance champion predictions with Gemini
    enhanced_leagues: dict = {}
    for slug, data in leagues_by_slug.items():
        league_name = data.get("name") or SLUG_TO_NAME.get(slug, slug)
        champion_data = data.get("champion", {})
        ml_team = champion_data.get("team", "Unknown")
        ml_prob = champion_data.get("probability", 0.5)

        if model:
            print(f"\n[Gemini] Enhancing champion for {league_name} (ML: {ml_team})...")
            enhanced = enhance_champion_with_gemini(model, league_name, ml_team, ml_prob)
        else:
            enhanced = {"team": ml_team, "probability": ml_prob}

        enhanced_leagues[slug] = dict(data)
        enhanced_leagues[slug]["champion"] = {
            "team": enhanced["team"],
            "probability": enhanced["probability"],
            "ml_original": ml_team,
            "ml_probability": ml_prob,
        }

    # Helper to get champion team for a slug
    def champ_team(slug: str) -> str:
        return enhanced_leagues.get(slug, {}).get("champion", {}).get("team", "Unknown")

    def champ_prob(slug: str) -> float:
        return enhanced_leagues.get(slug, {}).get("champion", {}).get("probability", 0.5)

    # Build per-league trophies
    per_league = {}

    # Premier League
    pl_slug = "premier-league"
    per_league[pl_slug] = {
        "title": {
            "team": champ_team(pl_slug),
            "probability": champ_prob(pl_slug),
        },
        "golden_boot": players["pl_golden_boot"],
        "playmaker_award": players["pl_playmaker"],
        "golden_glove": players["pl_golden_glove"],
    }

    # La Liga
    ll_slug = "la-liga"
    per_league[ll_slug] = {
        "title": {
            "team": champ_team(ll_slug),
            "probability": champ_prob(ll_slug),
        },
        "pichichi": players["ll_pichichi"],
        "zamora": players["ll_zamora"],
        "top_assists": players["ll_top_assists"],
    }

    # Serie A
    sa_slug = "serie-a"
    per_league[sa_slug] = {
        "title": {
            "team": champ_team(sa_slug),
            "probability": champ_prob(sa_slug),
        },
        "capocannoniere": players["sa_capocannoniere"],
        "top_assists": players["sa_top_assists"],
    }

    # Bundesliga
    bl_slug = "bundesliga"
    per_league[bl_slug] = {
        "title": {
            "team": champ_team(bl_slug),
            "probability": champ_prob(bl_slug),
        },
        "torjaegerkanone": players["bl_torjaeger"],
        "top_assists": players["bl_top_assists"],
    }

    # Ligue 1
    l1_slug = "ligue-1"
    per_league[l1_slug] = {
        "title": {
            "team": champ_team(l1_slug),
            "probability": champ_prob(l1_slug),
        },
        "meilleur_buteur": players["l1_buteur"],
        "top_assists": players["l1_top_assists"],
    }

    # Global trophies
    gerd = dict(players["gerd_muller_trophy"])
    egb = dict(players["european_golden_boot"])
    ballon = dict(players["ballon_dor"])
    kopa = dict(players["kopa_trophy"])
    yashin = dict(players["yashin_trophy"])

    global_trophies = {
        "ballon_dor": ballon,
        "kopa_trophy": kopa,
        "yashin_trophy": yashin,
        "gerd_muller_trophy": gerd,
        "european_golden_boot": egb,
    }

    # Champions League
    ucl_winner = dict(players["ucl_winner"])
    ucl_runner = dict(players["ucl_runner_up"])
    ucl_scorer = dict(players["ucl_top_scorer"])

    champions_league = {
        "winner": {
            "team": ucl_winner.get("team", "Real Madrid"),
            "league": ucl_winner.get("league", "La Liga"),
            "probability": ucl_winner.get("probability", 0.28),
        },
        "runner_up": {
            "team": ucl_runner.get("team", "Manchester City"),
            "league": ucl_runner.get("league", "Premier League"),
            "probability": ucl_runner.get("probability", 0.18),
        },
        "top_scorer": ucl_scorer,
        "final_venue": "Allianz Arena, Munich",
    }

    return {
        "generated_at": datetime.date(2025, 5, 25).isoformat(),
        "leagues": enhanced_leagues,
        "global_trophies": global_trophies,
        "champions_league": champions_league,
        "per_league_trophies": per_league,
    }


# ---------------------------------------------------------------------------
# Save output
# ---------------------------------------------------------------------------

def save_final_predictions(data: dict) -> None:
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nFinal predictions saved to: {OUTPUT_FILE}")


# ---------------------------------------------------------------------------
# Pretty summary
# ---------------------------------------------------------------------------

def print_summary(data: dict) -> None:
    separator = "=" * 70
    thin = "-" * 70

    print(f"\n{separator}")
    print("  FOOTBALL PREDICT — FINAL 2024/25 TROPHY PREDICTIONS")
    print(separator)

    # Global trophies
    print("\n  GLOBAL TROPHIES (5)")
    print(thin)
    gt = data.get("global_trophies", {})
    rows = [
        ("Ballon d'Or",          gt.get("ballon_dor", {}),          ["player", "team", "league"]),
        ("Kopa Trophy (U21)",     gt.get("kopa_trophy", {}),         ["player", "team", "league"]),
        ("Yashin Trophy (GK)",    gt.get("yashin_trophy", {}),       ["player", "team", "league"]),
        ("Gerd Muller Trophy",    gt.get("gerd_muller_trophy", {}),  ["player", "team", "goals"]),
        ("European Golden Boot",  gt.get("european_golden_boot", {}),["player", "team", "goals"]),
    ]
    for label, info, fields in rows:
        detail = "  |  ".join(f"{k}: {info.get(k, 'N/A')}" for k in fields)
        print(f"  {label:<26} {detail}")

    # Champions League
    print(f"\n  CHAMPIONS LEAGUE (1)")
    print(thin)
    ucl = data.get("champions_league", {})
    w = ucl.get("winner", {})
    r = ucl.get("runner_up", {})
    ts = ucl.get("top_scorer", {})
    print(f"  Winner         : {w.get('team', 'N/A')} ({w.get('league', 'N/A')})  prob={w.get('probability', 0):.2f}")
    print(f"  Runner-up      : {r.get('team', 'N/A')} ({r.get('league', 'N/A')})  prob={r.get('probability', 0):.2f}")
    print(f"  Top Scorer     : {ts.get('player', 'N/A')} ({ts.get('team', 'N/A')})")
    print(f"  Final Venue    : {ucl.get('final_venue', 'N/A')}")

    # Per-league trophies
    league_sections = [
        ("premier-league", "PREMIER LEAGUE (4)", [
            ("Title",            "title",          ["team"]),
            ("Golden Boot",      "golden_boot",    ["player", "team", "goals"]),
            ("Playmaker Award",  "playmaker_award",["player", "team", "assists"]),
            ("Golden Glove",     "golden_glove",   ["player", "team", "clean_sheets"]),
        ]),
        ("la-liga", "LA LIGA (4)", [
            ("Title",        "title",       ["team"]),
            ("Pichichi",     "pichichi",    ["player", "team", "goals"]),
            ("Zamora",       "zamora",      ["player", "team", "goals_conceded_ratio"]),
            ("Top Assists",  "top_assists", ["player", "team", "assists"]),
        ]),
        ("serie-a", "SERIE A (3)", [
            ("Title (Scudetto)",  "title",           ["team"]),
            ("Capocannoniere",    "capocannoniere",  ["player", "team", "goals"]),
            ("Top Assists",       "top_assists",     ["player", "team", "assists"]),
        ]),
        ("bundesliga", "BUNDESLIGA (3)", [
            ("Title (Meisterschale)", "title",           ["team"]),
            ("Torjaegerkanone",       "torjaegerkanone", ["player", "team", "goals"]),
            ("Top Assists",           "top_assists",     ["player", "team", "assists"]),
        ]),
        ("ligue-1", "LIGUE 1 (3)", [
            ("Title",             "title",           ["team"]),
            ("Meilleur Buteur",   "meilleur_buteur", ["player", "team", "goals"]),
            ("Top Assists",       "top_assists",     ["player", "team", "assists"]),
        ]),
    ]

    plt = data.get("per_league_trophies", {})
    for slug, section_title, trophies in league_sections:
        print(f"\n  {section_title}")
        print(thin)
        league_data = plt.get(slug, {})
        for label, key, fields in trophies:
            info = league_data.get(key, {})
            detail = "  |  ".join(f"{k}: {info.get(k, 'N/A')}" for k in fields)
            print(f"  {label:<26} {detail}")

    print(f"\n{separator}")
    print("  Total: 23 trophy predictions generated.")
    print(f"  Output: {OUTPUT_FILE}")
    gemini_status = "ENABLED" if GEMINI_API_KEY else "DISABLED (no API key)"
    print(f"  Gemini AI     : {gemini_status}")
    print(separator)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 70)
    print("  Football Predict — Enhanced Trophy Predictor")
    print("=" * 70)
    print(f"  Base directory  : {BASE_DIR}")
    print(f"  Input           : {INPUT_FILE}")
    print(f"  Output          : {OUTPUT_FILE}")
    print(f"  Gemini API key  : {'set (' + GEMINI_API_KEY[:6] + '...)' if GEMINI_API_KEY else 'not set'}")
    print()

    # Load ML predictions
    print("[1/4] Loading ML predictions...")
    leagues_raw = load_predictions()
    if leagues_raw:
        print(f"  Found {len(leagues_raw)} league(s): {', '.join(leagues_raw.keys())}")
    else:
        print("  No ML predictions found. Proceeding with defaults only.")

    # Initialize Gemini
    print("\n[2/4] Initializing Gemini AI...")
    model = None
    if GEMINI_API_KEY:
        model = get_gemini_model()
        if model:
            print("  Gemini 1.5 Flash ready.")
        else:
            print("  Gemini initialization failed. Using defaults.")
    else:
        print("  GEMINI_API_KEY not set. Skipping AI enhancement.")

    # Build final predictions
    print("\n[3/4] Building final predictions...")
    final = build_final_predictions(leagues_raw, model)

    # Save output
    print("\n[4/4] Saving output...")
    save_final_predictions(final)

    # Print summary
    print_summary(final)


if __name__ == "__main__":
    main()
