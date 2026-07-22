<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    /** @use HasFactory<\Database\Factories\BranchFactory> */
    use HasFactory;

    protected $primaryKey = 'branch_ID';

    protected $fillable = [
        'branch_name',
        'branch_location',
        'latitude',
        'longitude',
        'contact_number',
        'map_link',
        'fb_link',
        'branch_img',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    /** @return HasMany<StaffAccount, $this> */
    public function staffAccounts(): HasMany
    {
        return $this->hasMany(StaffAccount::class, 'branch_ID', 'branch_ID');
    }

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'branch_ID', 'branch_ID');
    }

    /** @return HasMany<Distribution, $this> */
    public function outboundDistributions(): HasMany
    {
        return $this->hasMany(Distribution::class, 'from_branch_ID', 'branch_ID');
    }

    /** @return HasMany<Distribution, $this> */
    public function inboundDistributions(): HasMany
    {
        return $this->hasMany(Distribution::class, 'to_branch_ID', 'branch_ID');
    }

    /** @return HasMany<PatientVisit, $this> */
    public function patientVisits(): HasMany
    {
        return $this->hasMany(PatientVisit::class, 'branch_ID', 'branch_ID');
    }
}
