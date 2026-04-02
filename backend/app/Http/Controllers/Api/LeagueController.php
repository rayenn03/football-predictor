<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\League;
use App\Models\Prediction;
use Illuminate\Http\JsonResponse;

class LeagueController extends Controller
{
    public function index(): JsonResponse
    {
        $leagues = League::with(['predictions' => function ($q) {
                $q->where('type', 'champion')->latest()->limit(1);
            }])
            ->get()
            ->map(function ($league) {
                $prediction = $league->predictions->first();
                $data = $prediction ? $prediction->data : [];
                return [
                    'id' => $league->id,
                    'name' => $league->name,
                    'slug' => $league->slug,
                    'country' => $league->country,
                    'logo_url' => $league->logo_url,
                    'teams_count' => $league->teams_count,
                    'predicted_champion' => $data['winner'] ?? ($data['top4'][0]['team'] ?? null),
                    'model_accuracy' => $prediction->model_accuracy ?? null,
                ];
            });

        return response()->json(['data' => $leagues]);
    }

    public function show(string $slug): JsonResponse
    {
        $league = League::where('slug', $slug)->firstOrFail();

        $standings = $league->standings()
            ->with('team')
            ->orderBy('position')
            ->get()
            ->map(fn($s) => [
                'position' => $s->position,
                'team' => $s->team->name,
                'team_slug' => $s->team->slug,
                'played' => $s->played,
                'won' => $s->won,
                'drawn' => $s->drawn,
                'lost' => $s->lost,
                'goals_for' => $s->goals_for,
                'goals_against' => $s->goals_against,
                'goal_difference' => $s->goal_difference,
                'points' => $s->points,
            ]);

        return response()->json([
            'data' => [
                'league' => [
                    'id' => $league->id,
                    'name' => $league->name,
                    'slug' => $league->slug,
                    'country' => $league->country,
                    'teams_count' => $league->teams_count,
                ],
                'standings' => $standings,
            ]
        ]);
    }

    public function predictions(string $slug): JsonResponse
    {
        $league = League::where('slug', $slug)->firstOrFail();

        $predictions = Prediction::where('league_id', $league->id)
            ->whereIn('type', ['champion', 'top_scorer', 'top_assists', 'trophies'])
            ->get()
            ->keyBy('type')
            ->map(fn($p) => [
                'type' => $p->type,
                'data' => $p->data,
                'confidence' => $p->confidence,
                'model_accuracy' => $p->model_accuracy,
                'generated_at' => $p->generated_at,
            ]);

        return response()->json(['data' => $predictions]);
    }

    public function topScorers(string $slug): JsonResponse
    {
        $league = League::where('slug', $slug)->firstOrFail();

        $prediction = Prediction::where('league_id', $league->id)
            ->where('type', 'top_scorer')
            ->latest()
            ->first();

        return response()->json([
            'data' => $prediction ? $prediction->data : []
        ]);
    }
}
