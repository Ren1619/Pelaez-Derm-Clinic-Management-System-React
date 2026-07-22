<?php

namespace App\Http\Middleware;

use App\Enums\StaffModule;
use App\Enums\StaffRole;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\AppointmentNotificationService;
use App\Services\SystemNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = Auth::guard('web')->user();
        $patient = Auth::guard('patient')->user();
        $systemSettings = SystemSetting::current()->toPublicArray();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'branding' => [
                'name' => $systemSettings['business_name'],
                'logo_url' => $systemSettings['business_logo_url'],
            ],
            'auth' => [
                'user' => $this->serializeUser($user),
                'permissions' => $this->serializePermissions($user),
            ],
            'notificationSummary' => fn (): array => $this->notificationSummary($user, $patient),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /** @return array{unread_count: int, items: list<array<string, mixed>>} */
    private function notificationSummary(StaffAccount|User|null $user, mixed $patient): array
    {
        $service = app(SystemNotificationService::class);

        if ($patient instanceof Patient) {
            app(AppointmentNotificationService::class)->createDueReminders($patient);

            return $service->patientSummary($patient);
        }

        if ($user instanceof StaffAccount || $user instanceof User) {
            return $service->staffSummary($user);
        }

        return ['unread_count' => 0, 'items' => []];
    }

    /** @return array<string, mixed>|null */
    private function serializeUser(StaffAccount|User|null $user): ?array
    {
        if ($user === null) {
            return null;
        }

        if ($user instanceof User) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'role' => ['name' => StaffRole::SuperAdmin->value, 'label' => StaffRole::SuperAdmin->label()],
                'branch' => null,
                'created_at' => $user->created_at?->toISOString(),
                'updated_at' => $user->updated_at?->toISOString(),
            ];
        }

        $user->loadMissing(['role', 'branch']);
        $role = $user->roleKey();

        return [
            'id' => $user->account_ID,
            'name' => $user->full_name,
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'role' => [
                'id' => $user->role_ID,
                'name' => $role?->value,
                'label' => $role?->label(),
            ],
            'branch' => $user->branch === null ? null : [
                'id' => $user->branch->branch_ID,
                'name' => $user->branch->branch_name,
            ],
            'created_at' => $user->created_at?->toISOString(),
            'updated_at' => $user->updated_at?->toISOString(),
        ];
    }

    /** @return array{modules: list<string>, can_view_all_branches: bool} */
    private function serializePermissions(StaffAccount|User|null $user): array
    {
        if ($user instanceof User) {
            return [
                'modules' => array_map(fn (StaffModule $module): string => $module->value, StaffModule::cases()),
                'can_view_all_branches' => true,
            ];
        }

        return [
            'modules' => array_map(
                fn (StaffModule $module): string => $module->value,
                $user?->roleKey()?->modules() ?? [],
            ),
            'can_view_all_branches' => $user?->isSuperAdmin() ?? false,
        ];
    }
}
