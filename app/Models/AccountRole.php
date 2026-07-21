<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountRole extends Model
{
    /** @use HasFactory<\Database\Factories\AccountRoleFactory> */
    use HasFactory;

    protected $primaryKey = 'role_ID';

    protected $fillable = ['role_name'];

    /** @return HasMany<StaffAccount, $this> */
    public function staffAccounts(): HasMany
    {
        return $this->hasMany(StaffAccount::class, 'role_ID', 'role_ID');
    }
}
