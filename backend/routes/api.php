<?php
use App\Http\Controllers\Api\LeagueController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ChampionsLeagueController;
use App\Http\Controllers\Api\AnalyticsController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/trophies', [DashboardController::class, 'trophies']);

Route::get('/leagues', [LeagueController::class, 'index']);
Route::get('/leagues/{slug}', [LeagueController::class, 'show']);
Route::get('/leagues/{slug}/predictions', [LeagueController::class, 'predictions']);
Route::get('/leagues/{slug}/top-scorers', [LeagueController::class, 'topScorers']);

Route::get('/champions-league', [ChampionsLeagueController::class, 'index']);

Route::get('/analytics', [AnalyticsController::class, 'overview']);
Route::get('/compare/{slug1}/{slug2}', [AnalyticsController::class, 'compare']);
