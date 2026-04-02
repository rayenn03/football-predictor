# CLAUDE.md — Football Predictor Project

## Project Overview

A full-stack web application that predicts football league winners, top scorers, top assists, and Champions League winners using **machine learning** trained on **real historical data** from the last 10 seasons of Europe's 5 major leagues.

**Stack:** React.js (frontend) + Laravel 12 (backend API) + PostgreSQL 17 (database) + Python/scikit-learn (ML pipeline) + Gemini AI (contextual reasoning)

**Data Source:** football-data.co.uk (free, public domain, CSV format, updated weekly)

---

## Architecture

```
football/
├── ml/                          # Python ML pipeline
│   ├── scripts/
│   │   ├── download_data.py     # Step 1: Download 10 seasons of CSVs
│   │   ├── feature_engineering.py # Step 2: Compute 25+ features per team
│   │   ├── train_model.py       # Step 3: Train RF + GB ensemble models
│   │   └── predict.py           # Step 4: Gemini AI enhancement
│   ├── data/
│   │   ├── raw/                 # Downloaded CSVs (per league/season)
│   │   └── processed/           # Cleaned CSVs + feature matrices
│   ├── models/                  # Trained .joblib models + predictions.json
│   └── requirements.txt         # Python dependencies
│
├── backend/                     # Laravel 12 API
│   ├── app/
│   │   ├── Models/              # 8 Eloquent models (League, Team, Player, etc.)
│   │   ├── Http/Controllers/Api/ # REST API controllers
│   │   └── Services/            # Business logic (if needed)
│   ├── database/
│   │   ├── migrations/          # PostgreSQL table definitions
│   │   └── seeders/             # Imports ML predictions into DB
│   └── routes/api.php           # API route definitions
│
├── frontend/                    # React + Vite
│   └── src/
│       ├── components/
│       │   ├── layout/          # Layout.jsx (header + footer)
│       │   └── pages/           # LandingPage, Dashboard, LeagueDetail, UCLPage
│       ├── services/api.js      # API client (all HTTP calls)
│       ├── hooks/useFetch.js    # Custom data fetching hook
│       └── styles/              # CSS files
│
├── docker-compose.yml           # PostgreSQL container
├── .env.example                 # Environment variables template
└── CLAUDE.md                    # This file
```

---

## Setup Instructions (Run in Order)

### 1. PostgreSQL Database

```bash
# Option A: Docker (recommended)
docker-compose up -d

# Option B: Local PostgreSQL
# Create database: football_predictor
# User: postgres, Password: secret (or update .env)
```

### 2. ML Pipeline (Python)

```bash
cd ml
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Step 1: Download match data (~5 min, downloads ~55 CSV files)
python scripts/download_data.py

# Step 2: Feature engineering (~30 sec)
python scripts/feature_engineering.py

# Step 3: Train ML models (~2 min)
python scripts/train_model.py

# Step 4: Gemini AI enhancement (needs GEMINI_API_KEY in ../.env)
python scripts/predict.py
```

### 3. Laravel Backend

```bash
cd backend
composer install
cp ../.env.example .env
php artisan key:generate

# Create tables
php artisan migrate

# Import ML predictions into database
php artisan db:seed

# Start API server
php artisan serve    # → http://localhost:8000
```

### 4. React Frontend

```bash
cd frontend
npm install
cp ../.env.example .env

# Start dev server
npm run dev          # → http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | All leagues + UCL predictions (landing page) |
| GET | `/api/leagues` | List all 5 leagues |
| GET | `/api/leagues/{slug}` | League detail + standings |
| GET | `/api/leagues/{slug}/top-scorers` | Top 10 scorers |
| GET | `/api/leagues/{slug}/top-assists` | Top 10 assists |
| GET | `/api/leagues/{slug}/predictions` | ML predictions |
| GET | `/api/champions-league` | UCL predictions |

League slugs: `premier-league`, `la-liga`, `serie-a`, `bundesliga`, `ligue-1`

### Trophy Predictions (NEW in v2.0)

**Global Trophies:**
- 🏅 Ballon d'Or — best overall player (cross-league, weighted by team trophies)
- 🌟 Kopa Trophy — best young player (under 21)
- 🧤 Yashin Trophy — best goalkeeper
- 🔫 Gerd Müller Trophy — top scorer across all competitions
- 👟 European Golden Boot — top scorer across all European leagues (coefficient weighted)

**Per-League Trophies:**
- 🏆 League title (all 5 leagues)
- ⚽ **Pichichi** (La Liga top scorer) — named after Athletic Bilbao's Moreno
- ⚽ **Capocannoniere** (Serie A top scorer) — means "top gunner"
- ⚽ **Torjägerkanone** (Bundesliga top scorer) — a literal cannon trophy
- 👟 **PL Golden Boot** (Premier League top scorer)
- 🎯 **PL Playmaker Award** (Premier League most assists)
- 🧤 **PL Golden Glove** (Premier League most clean sheets)
- 🧤 **Trofeo Zamora** (La Liga best GK, fewest goals/game)
- 🎯 Top assists for all 5 leagues

---

## Database Schema

8 tables with proper foreign keys and indexes:

- **leagues** — 5 major European leagues
- **seasons** — 10+ seasons per league (is_current marks prediction target)
- **teams** — football clubs with ELO ratings
- **players** — player records for top scorer/assist tracking
- **standings** — league tables (position, points, goals, form)
- **player_stats** — per-season player statistics
- **matches** — historical match results
- **predictions** — ML model outputs with confidence scores and AI reasoning

Key relationships: leagues → seasons → standings → teams, leagues → teams → players → player_stats

---

## ML Pipeline Details

### Data Source
- football-data.co.uk CSV files
- Columns used: HomeTeam, AwayTeam, FTHG, FTAG, FTR, HS, AS, HST, AST, HC, AC, HF, AF, HY, AY, HR, AR
- 10 seasons × 5 leagues = ~19,000+ matches

### Features (25+ per team-season)
- Basic: wins, draws, losses, points, goal_difference
- Rates: win_pct, goals_per_game, conceded_per_game, points_per_game
- Home/Away: home_win_pct, away_win_pct, home_goals_pg, away_goals_pg
- Shots: shots_per_game, sot_per_game, shot_accuracy, goals_per_shot
- Defensive: clean_sheets, clean_sheet_pct
- Discipline: yellows_per_game, reds_per_game, fouls_per_game
- Form: form_points (last 5 matches), form_gf, form_ga
- Advanced: elo_rating (chess-style), avg_position_last_3, titles_in_dataset

### Models
- **Random Forest** (200 trees, max_depth=10) — stable, resistant to overfitting
- **Gradient Boosting** (150 trees, learning_rate=0.1) — captures complex patterns
- **Ensemble**: 40% RF + 60% GB weighted average
- **Gemini AI**: contextual reasoning layer (top scorer/assist predictions, UCL analysis)

### Training Strategy
- Train on seasons 1–9, predict season 10
- Temporal split (not random) — matches real-world forecasting
- Cross-validation: 5-fold on training data
- Evaluation: MAE (position error), champion accuracy, top-4 overlap

---

## Coding Conventions

### Python (ML)
- Python 3.10+
- Type hints on function signatures
- Docstrings on all public functions
- pandas for data manipulation, scikit-learn for ML
- Constants in UPPER_SNAKE_CASE

### PHP/Laravel (Backend)
- Laravel 12, PHP 8.2+
- Thin controllers, logic in models/services
- Eloquent ORM (no raw SQL)
- JSON responses with consistent `{ data: ... }` wrapper
- Foreign keys and indexes on all relationships

### React (Frontend)
- Functional components only (no class components)
- Custom hooks for data fetching (useFetch)
- CSS files per component (no CSS-in-JS)
- API calls through services/api.js only
- React Router v6 for navigation

### General
- No console.log in production code
- Error boundaries around data-dependent components
- Loading states for all async operations
- Mobile-responsive layouts

---

## Environment Variables (.env)

```env
# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=football_predictor
DB_USERNAME=postgres
DB_PASSWORD=secret

# Gemini AI (optional — fallback to rule-based if missing)
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend
VITE_API_URL=http://localhost:8000/api
```

---

## Common Tasks for Claude Code

### "Add a new feature to the prediction model"
1. Add the feature computation in `ml/scripts/feature_engineering.py` → `build_features_for_league()`
2. Add the column name to `FEATURE_COLUMNS` in `ml/scripts/train_model.py`
3. Re-run: `python feature_engineering.py && python train_model.py && python predict.py`
4. Re-seed: `php artisan db:seed --force`

### "Add a new API endpoint"
1. Add route in `backend/routes/api.php`
2. Add controller method in the appropriate controller
3. Add corresponding method in `frontend/src/services/api.js`

### "Fix a frontend styling issue"
- CSS files are in the same directory as their component
- Global variables are in `frontend/src/styles/layout.css`
- Theme colors use CSS custom properties (--bg-card, --accent, etc.)

### "Update league data"
1. `cd ml && python scripts/download_data.py` (re-downloads latest season)
2. `python scripts/feature_engineering.py`
3. `python scripts/train_model.py`
4. `python scripts/predict.py`
5. `cd ../backend && php artisan db:seed --force`

---

## Important Notes

- The ML pipeline must be run BEFORE the Laravel seeder (seeder reads ML output JSON)
- football-data.co.uk updates CSVs twice weekly (Sunday + Wednesday nights)
- Bundesliga has 18 teams (not 20 like other leagues) — handled in code
- "Match" is a reserved word in PHP — the model is named `FootballMatch`
- All models are in a single file `AllModels.php` — split into individual files when setting up Laravel
- ELO ratings are cross-league comparable — used for UCL predictions
