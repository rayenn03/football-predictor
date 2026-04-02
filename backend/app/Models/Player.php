<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Player extends Model {
    protected $fillable = ['name', 'team_id', 'league_id', 'position', 'nationality', 'age'];

    public function team() { return $this->belongsTo(Team::class); }
    public function league() { return $this->belongsTo(League::class); }
    public function stats() { return $this->hasMany(PlayerStat::class); }
}
