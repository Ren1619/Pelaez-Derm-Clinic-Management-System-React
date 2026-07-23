<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $module
 * @property string $subject_type
 * @property int $subject_id
 * @property int|null $branch_id
 * @property int|null $secondary_branch_id
 * @property Carbon|null $created_at
 */
class NewRecordEvent extends Model
{
    protected $fillable = [
        'module',
        'subject_type',
        'subject_id',
        'branch_id',
        'secondary_branch_id',
    ];

    /** @return HasMany<NewRecordEventRead, $this> */
    public function reads(): HasMany
    {
        return $this->hasMany(NewRecordEventRead::class);
    }
}
