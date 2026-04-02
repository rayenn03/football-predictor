<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Prediction extends Model {
    protected $fillable = ['league_id', 'season_id', 'type', 'data', 'confidence', 'model_accuracy', 'generated_at'];
    protected $casts = ['data' => 'array', 'generated_at' => 'datetime'];

    public function league() { return $this->belongsTo(League::class); }
    public function season() { return $this->belongsTo(Season::class); }
}
