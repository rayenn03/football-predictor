<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\League;
use App\Models\Prediction;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $leagues = League::all()->map(function ($league) {
            $champion = Prediction::where('league_id', $league->id)
                ->where('type', 'champion')
                ->latest()->first();
            $scorer = Prediction::where('league_id', $league->id)
                ->where('type', 'top_scorer')
                ->latest()->first();
            $assists = Prediction::where('league_id', $league->id)
                ->where('type', 'top_assists')
                ->latest()->first();

            return [
                'league' => [
                    'id' => $league->id,
                    'name' => $league->name,
                    'slug' => $league->slug,
                    'country' => $league->country,
                ],
                'champion' => $champion ? $champion->data : null,
                'top_scorer' => $scorer ? $scorer->data : null,
                'top_assists' => $assists ? $assists->data : null,
                'model_accuracy' => $champion->model_accuracy ?? null,
            ];
        });

        $globalPredictions = Prediction::whereNull('league_id')
            ->orWhere('type', 'global')
            ->get()
            ->keyBy('type')
            ->map(fn($p) => $p->data);

        $confidenceBreakdown = League::all()->map(function ($league) {
            $champion = Prediction::where('league_id', $league->id)
                ->where('type', 'champion')->latest()->first();
            $data = $champion ? $champion->data : [];
            return [
                'league' => $league->name,
                'slug' => $league->slug,
                'probability' => $data['probability'] ?? ($data['top4'][0]['probability'] ?? 0),
                'model_accuracy' => $champion->model_accuracy ?? 0,
            ];
        });

        return response()->json([
            'data' => [
                'leagues' => $leagues,
                'global_predictions' => $globalPredictions,
                'total_predictions' => 23,
                'confidence_breakdown' => $confidenceBreakdown,
            ]
        ]);
    }

    public function trophies(): JsonResponse
    {
        $globalTrophies = Prediction::where('type', 'global')
            ->latest()->first();

        $leagueTrophies = League::all()->map(function ($league) {
            $trophies = Prediction::where('league_id', $league->id)
                ->where('type', 'trophies')
                ->latest()->first();
            return [
                'slug' => $league->slug,
                'name' => $league->name,
                'country' => $league->country,
                'trophies' => $trophies ? $trophies->data : [],
            ];
        });

        return response()->json([
            'data' => [
                'global_trophies' => $globalTrophies ? $globalTrophies->data : [],
                'leagues' => $leagueTrophies,
            ]
        ]);
    }
}
