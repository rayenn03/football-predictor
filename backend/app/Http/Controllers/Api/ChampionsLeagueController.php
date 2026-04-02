<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use Illuminate\Http\JsonResponse;

class ChampionsLeagueController extends Controller
{
    public function index(): JsonResponse
    {
        $prediction = Prediction::where('type', 'champions_league')
            ->latest()->first();

        return response()->json([
            'data' => $prediction ? $prediction->data : [
                'winner' => 'TBD',
                'runner_up' => 'TBD',
                'confidence' => 0,
            ]
        ]);
    }
}
