<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use App\Services\SystemNotificationService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private SystemNotificationService $notifications) {}

    public function read(Request $request, SystemNotification $systemNotification): RedirectResponse
    {
        $this->notifications->markStaffRead($this->staff($request), $systemNotification);

        return back();
    }

    public function readAll(Request $request): RedirectResponse
    {
        $this->notifications->markAllStaffRead($this->staff($request));

        return back();
    }

    private function staff(Request $request): Authenticatable
    {
        $staff = $request->user();
        abort_unless($staff instanceof Authenticatable, 401);

        return $staff;
    }
}
