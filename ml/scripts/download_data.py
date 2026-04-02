import os
import requests
import pandas as pd
from tqdm import tqdm

BASE_URL = "https://www.football-data.co.uk/mmz4281/{season}/{league}.csv"

LEAGUES = ["E0", "SP1", "I1", "D1", "F1"]

SEASONS = [
    "1415", "1516", "1617", "1718", "1819",
    "1920", "2021", "2122", "2223", "2324", "2425"
]

RAW_DIR = os.path.join("data", "raw")
PROCESSED_DIR = os.path.join("data", "processed")


def ensure_dirs():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)


def download_all():
    ensure_dirs()

    download_counts = {league: 0 for league in LEAGUES}

    total = len(LEAGUES) * len(SEASONS)
    with tqdm(total=total, desc="Downloading CSVs") as pbar:
        for league in LEAGUES:
            for season in SEASONS:
                url = BASE_URL.format(season=season, league=league)
                filename = f"{league}_{season}.csv"
                filepath = os.path.join(RAW_DIR, filename)

                pbar.set_postfix({"file": filename})

                try:
                    response = requests.get(url, timeout=30)
                    if response.status_code == 404:
                        pbar.update(1)
                        continue
                    response.raise_for_status()

                    with open(filepath, "wb") as f:
                        f.write(response.content)

                    download_counts[league] += 1

                except requests.exceptions.HTTPError as e:
                    tqdm.write(f"HTTP error for {filename}: {e}")
                except requests.exceptions.RequestException as e:
                    tqdm.write(f"Request error for {filename}: {e}")

                pbar.update(1)

    return download_counts


def merge_per_league():
    print("\nMerging CSVs per league...")
    for league in tqdm(LEAGUES, desc="Merging"):
        dfs = []
        for season in SEASONS:
            filepath = os.path.join(RAW_DIR, f"{league}_{season}.csv")
            if not os.path.exists(filepath):
                continue
            try:
                df = pd.read_csv(filepath, encoding="latin-1", on_bad_lines="skip")
                df["season"] = season
                df["league"] = league
                dfs.append(df)
            except Exception as e:
                tqdm.write(f"Error reading {league}_{season}.csv: {e}")

        if dfs:
            merged = pd.concat(dfs, ignore_index=True, sort=False)
            out_path = os.path.join(PROCESSED_DIR, f"{league}_all.csv")
            merged.to_csv(out_path, index=False)
            tqdm.write(f"Saved {out_path} ({len(merged)} rows)")


def print_summary(download_counts):
    league_names = {
        "E0": "Premier League",
        "SP1": "La Liga",
        "I1": "Serie A",
        "D1": "Bundesliga",
        "F1": "Ligue 1",
    }

    print("\n" + "=" * 45)
    print(f"{'League':<12} {'Name':<18} {'Files Downloaded':>15}")
    print("-" * 45)
    for league, count in download_counts.items():
        print(f"{league:<12} {league_names[league]:<18} {count:>15}/{len(SEASONS)}")
    print("=" * 45)
    total = sum(download_counts.values())
    print(f"{'TOTAL':<12} {'':<18} {total:>15}/{len(LEAGUES) * len(SEASONS)}")
    print("=" * 45)


if __name__ == "__main__":
    print("Football Data Downloader")
    print(f"Leagues : {', '.join(LEAGUES)}")
    print(f"Seasons : {SEASONS[0]} -> {SEASONS[-1]}")
    print(f"Total   : {len(LEAGUES) * len(SEASONS)} files\n")

    download_counts = download_all()
    merge_per_league()
    print_summary(download_counts)
