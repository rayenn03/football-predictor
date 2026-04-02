<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Team extends Model {
    protected $fillable = ['name', 'slug', 'league_id', 'logo_url', 'city', 'stadium'];

    public function league() { return $this->belongsTo(League::class); }
    public function standings() { return $this->hasMany(Standing::class); }
    public function players() { return $this->hasMany(Player::class); }
}
