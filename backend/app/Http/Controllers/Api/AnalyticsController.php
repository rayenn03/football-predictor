<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\League;
use App\Models\Prediction;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function overview(): JsonResponse
    {
        $leagues = League::all();

        // Build cross-league comparison data
        $comparison = $leagues->map(function ($league) {
            $champion = Prediction::where('league_id', $league->id)
                ->where('type', 'champion')->latest()->first();
            $scorer = Prediction::where('league_id', $league->id)
                ->where('type', 'top_scorer')->latest()->first();
            $assists = Prediction::where('league_id', $league->id)
                ->where('type', 'top_assists')->latest()->first();
            $trophies = Prediction::where('league_id', $league->id)
                ->where('type', 'trophies')->latest()->first();

            $championData = $champion ? $champion->data : [];
            $top4 = $championData['top4'] ?? [];

            // Calculate dominance score (how dominant is the predicted champion)
            $topProb = !empty($top4) ? ($top4[0]['probability'] ?? 0) : 0;
            $secondProb = count($top4) > 1 ? ($top4[1]['probability'] ?? 0) : 0;
            $dominance = $topProb > 0 ? round(($topProb - $secondProb) / $topProb * 100, 1) : 0;

            return [
                'league' => [
                    'name' => $league->name,
                    'slug' => $league->slug,
                    'country' => $league->country,
                ],
                'champion' => $championData['winner'] ?? ($top4[0]['team'] ?? null),
                'champion_probability' => $topProb,
                'model_accuracy' => $champion->model_accuracy ?? null,
                'dominance_score' => $dominance,
                'competitiveness' => 100 - $dominance, // Higher = more competitive
                'top_scorer' => $scorer ? $scorer->data : null,
                'top_assists' => $assists ? $assists->data : null,
                'top4' => $top4,
                'trophy_count' => $trophies ? count($trophies->data) : 0,
            ];
        });

        // Find most competitive league
        $mostCompetitive = $comparison->sortByDesc('competitiveness')->first();
        $mostDominant = $comparison->sortByDesc('dominance_score')->first();

        // Aggregate stats
        $avgAccuracy = $comparison->avg('model_accuracy');
        $totalTrophies = Prediction::count();

        // Top scorer comparison across leagues
        $scorerComparison = $comparison->map(fn($l) => [
            'league' => $l['league']['name'],
            'slug' => $l['league']['slug'],
            'player' => $l['top_scorer']['player'] ?? '—',
            'goals' => $l['top_scorer']['goals'] ?? 0,
            'team' => $l['top_scorer']['team'] ?? '—',
        ])->sortByDesc('goals')->values();

        return response()->json([
            'data' => [
                'leagues' => $comparison->values(),
                'insights' => [
                    'most_competitive_league' => $mostCompetitive['league'] ?? null,
                    'most_dominant_league' => $mostDominant['league'] ?? null,
                    'avg_model_accuracy' => round($avgAccuracy, 4),
                    'total_predictions' => 23,
                    'total_records' => $totalTrophies,
                ],
                'scorer_ranking' => $scorerComparison,
            ]
        ]);
    }

    public function compare(string $slug1, string $slug2): JsonResponse
    {
        $league1 = League::where('slug', $slug1)->firstOrFail();
        $league2 = League::where('slug', $slug2)->firstOrFail();

        $buildLeagueData = function ($league) {
            $champion = Prediction::where('league_id', $league->id)
                ->where('type', 'champion')->latest()->first();
            $scorer = Prediction::where('league_id', $league->id)
                ->where('type', 'top_scorer')->latest()->first();
            $assists = Prediction::where('league_id', $league->id)
                ->where('type', 'top_assists')->latest()->first();
            $trophies = Prediction::where('league_id', $league->id)
                ->where('type', 'trophies')->latest()->first();

            $championData = $champion ? $champion->data : [];
            $top4 = $championData['top4'] ?? [];
            $topProb = !empty($top4) ? ($top4[0]['probability'] ?? 0) : 0;

            return [
                'league' => [
                    'name' => $league->name,
                    'slug' => $league->slug,
                    'country' => $league->country,
                    'teams_count' => $league->teams_count,
                ],
                'model_accuracy' => $champion->model_accuracy ?? 0,
                'champion_confidence' => $topProb,
                'competitiveness' => count($top4) > 1
                    ? round((1 - abs(($top4[0]['probability'] ?? 0) - ($top4[1]['probability'] ?? 0))) * 100, 1)
                    : 50,
                'top4' => $top4,
                'champion' => $championData['winner'] ?? ($top4[0]['team'] ?? null),
                'top_scorer' => $scorer ? $scorer->data : null,
                'top_assists' => $assists ? $assists->data : null,
                'trophies' => $trophies ? $trophies->data : [],
                'trophy_count' => $trophies ? count($trophies->data) : 0,
            ];
        };

        return response()->json([
            'data' => [
                'league1' => $buildLeagueData($league1),
                'league2' => $buildLeagueData($league2),
            ]
        ]);
    }
}
