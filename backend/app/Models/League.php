<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class League extends Model {
    protected $fillable = ['name', 'slug', 'country', 'logo_url', 'teams_count'];

    public function seasons() { return $this->hasMany(Season::class); }
    public function teams() { return $this->hasMany(Team::class); }
    public function predictions() { return $this->hasMany(Prediction::class); }
    public function standings() { return $this->hasMany(Standing::class); }
}
