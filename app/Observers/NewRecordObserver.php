<?php

namespace App\Observers;

use App\Models\Sale;
use App\Services\NewRecordService;
use Illuminate\Database\Eloquent\Model;

class NewRecordObserver
{
    public function __construct(private NewRecordService $newRecords) {}

    public function created(Model $model): void
    {
        $this->newRecords->record($model);
    }

    public function updated(Model $model): void
    {
        if ($model instanceof Sale && $model->finalized && $model->wasChanged('finalized')) {
            $this->newRecords->record($model);
        }
    }

    public function deleted(Model $model): void
    {
        $this->newRecords->remove($model);
    }
}
