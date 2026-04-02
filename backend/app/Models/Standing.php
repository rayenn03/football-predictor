<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Standing extends Model {
    protected $fillable = ['league_id', 'season_id', 'team_id', 'position', 'played', 'won', 'drawn', 'lost', 'goals_for', 'goals_against', 'goal_difference', 'points'];

    public function team() { return $this->belongsTo(Team::class); }
    public function league() { return $this->belongsTo(League::class); }
    public function season() { return $this->belongsTo(Season::class); }
}
