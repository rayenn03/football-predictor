<?php
namespace Database\Seeders;

use App\Models\League;
use App\Models\Season;
use App\Models\Prediction;
use Illuminate\Database\Seeder;

class PredictionSeeder extends Seeder
{
    private array $leagueMap = [
        'premier-league' => ['name' => 'Premier League', 'country' => 'England', 'teams' => 20],
        'la-liga'        => ['name' => 'La Liga', 'country' => 'Spain', 'teams' => 20],
        'serie-a'        => ['name' => 'Serie A', 'country' => 'Italy', 'teams' => 20],
        'bundesliga'     => ['name' => 'Bundesliga', 'country' => 'Germany', 'teams' => 18],
        'ligue-1'        => ['name' => 'Ligue 1', 'country' => 'France', 'teams' => 20],
    ];

    public function run(): void
    {
        $jsonPath = base_path('../ml/models/final_predictions.json');

        if (!file_exists($jsonPath)) {
            $this->command->warn("final_predictions.json not found at {$jsonPath}. Skipping.");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $leagues      = $data['leagues'] ?? [];
        $perLeague    = $data['per_league_trophies'] ?? [];
        $globalTrophy = $data['global_trophies'] ?? [];
        $ucl          = $data['champions_league'] ?? [];

        foreach ($this->leagueMap as $slug => $info) {
            $league = League::updateOrCreate(
                ['slug' => $slug],
                ['name' => $info['name'], 'country' => $info['country'], 'teams_count' => $info['teams']]
            );

            $season = Season::updateOrCreate(
                ['league_id' => $league->id, 'year' => '2024-25'],
                ['slug' => '2024-25', 'is_current' => true]
            );

            $leagueData  = $leagues[$slug] ?? null;
            $trophyData  = $perLeague[$slug] ?? [];

            if ($leagueData) {
                // Champion + top4
                Prediction::updateOrCreate(
                    ['league_id' => $league->id, 'type' => 'champion'],
                    [
                        'season_id'      => $season->id,
                        'data'           => [
                            'winner'  => $leagueData['champion']['team'] ?? null,
                            'top4'    => $leagueData['top4'] ?? [],
                            'probability' => $leagueData['champion']['probability'] ?? null,
                        ],
                        'confidence'     => $leagueData['champion']['probability'] ?? null,
                        'model_accuracy' => $leagueData['model_accuracy'] ?? null,
                        'generated_at'   => now(),
                    ]
                );
            }

            // Top scorer from per_league_trophies (golden_boot / pichichi / capocannoniere / torjaegerkanone / meilleur_buteur)
            $scorerKeys = ['golden_boot', 'pichichi', 'capocannoniere', 'torjaegerkanone', 'meilleur_buteur'];
            foreach ($scorerKeys as $key) {
                if (isset($trophyData[$key])) {
                    Prediction::updateOrCreate(
                        ['league_id' => $league->id, 'type' => 'top_scorer'],
                        [
                            'season_id'    => $season->id,
                            'data'         => $trophyData[$key],
                            'generated_at' => now(),
                        ]
                    );
                    break;
                }
            }

            // Top assists from per_league_trophies (playmaker_award / top_assists)
            $assistKeys = ['playmaker_award', 'top_assists'];
            foreach ($assistKeys as $key) {
                if (isset($trophyData[$key])) {
                    Prediction::updateOrCreate(
                        ['league_id' => $league->id, 'type' => 'top_assists'],
                        [
                            'season_id'    => $season->id,
                            'data'         => $trophyData[$key],
                            'generated_at' => now(),
                        ]
                    );
                    break;
                }
            }

            // All league trophies
            if (!empty($trophyData)) {
                Prediction::updateOrCreate(
                    ['league_id' => $league->id, 'type' => 'trophies'],
                    [
                        'season_id'    => $season->id,
                        'data'         => $trophyData,
                        'generated_at' => now(),
                    ]
                );
            }
        }

        // Champions League
        if (!empty($ucl)) {
            Prediction::updateOrCreate(
                ['league_id' => null, 'type' => 'champions_league'],
                ['data' => $ucl, 'generated_at' => now()]
            );
        }

        // Global trophies (Ballon d'Or, Kopa, Yashin, etc.)
        if (!empty($globalTrophy)) {
            Prediction::updateOrCreate(
                ['league_id' => null, 'type' => 'global'],
                ['data' => $globalTrophy, 'generated_at' => now()]
            );
        }

        $this->command->info('Predictions seeded successfully!');
    }
}
