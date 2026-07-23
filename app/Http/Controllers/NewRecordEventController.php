<?php

namespace App\Http\Controllers;

use App\Models\NewRecordEvent;
use App\Services\NewRecordService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NewRecordEventController extends Controller
{
    public function __construct(private NewRecordService $newRecords) {}

    public function __invoke(Request $request, NewRecordEvent $newRecordEvent): RedirectResponse
    {
        $viewer = $request->user();
        abort_unless($viewer instanceof Authenticatable, 401);

        $this->newRecords->markRead($viewer, $newRecordEvent);

        return back();
    }
}
