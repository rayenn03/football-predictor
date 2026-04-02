<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PlayerStat extends Model {
    protected $fillable = ['player_id', 'season_id', 'league_id', 'goals', 'assists', 'matches_played', 'minutes_played', 'yellow_cards', 'red_cards', 'clean_sheets'];

    public function player() { return $this->belongsTo(Player::class); }
    public function season() { return $this->belongsTo(Season::class); }
    public function league() { return $this->belongsTo(League::class); }
}
