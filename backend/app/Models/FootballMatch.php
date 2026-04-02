<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class FootballMatch extends Model {
    protected $table = 'matches';
    protected $fillable = ['league_id', 'season_id', 'home_team_id', 'away_team_id', 'home_goals', 'away_goals', 'result', 'match_date', 'home_shots', 'away_shots', 'home_shots_on_target', 'away_shots_on_target'];

    public function league() { return $this->belongsTo(League::class); }
    public function season() { return $this->belongsTo(Season::class); }
    public function homeTeam() { return $this->belongsTo(Team::class, 'home_team_id'); }
    public function awayTeam() { return $this->belongsTo(Team::class, 'away_team_id'); }
}
