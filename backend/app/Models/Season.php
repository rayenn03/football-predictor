<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Season extends Model {
    protected $fillable = ['league_id', 'year', 'slug', 'is_current', 'start_date', 'end_date'];

    public function league() { return $this->belongsTo(League::class); }
    public function standings() { return $this->hasMany(Standing::class); }
    public function matches() { return $this->hasMany(FootballMatch::class); }
    public function predictions() { return $this->hasMany(Prediction::class); }
}
