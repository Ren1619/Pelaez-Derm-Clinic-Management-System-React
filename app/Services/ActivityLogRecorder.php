<?php

namespace App\Services;

use App\Models\AccountRole;
use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Distribution;
use App\Models\DistributionItem;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Feedback;
use App\Models\Patient;
use App\Models\PatientAllergy;
use App\Models\PatientMedicalCondition;
use App\Models\PatientMedication;
use App\Models\PatientVisit;
use App\Models\PatientVisitDiagnosis;
use App\Models\PatientVisitPrescription;
use App\Models\PatientVisitProduct;
use App\Models\PatientVisitService;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleProductItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\SaleServiceItem;
use App\Models\Service;
use App\Models\StaffAccount;
use App\Models\SystemNotification;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

class ActivityLogRecorder
{
    /** @var array<class-string<Model>, string> */
    private const MODEL_CONTEXTS = [
        AccountRole::class => 'staff',
        Appointment::class => 'appointments',
        AppointmentService::class => 'appointments',
        Branch::class => 'branches',
        Category::class => 'categories',
        Distribution::class => 'distribution',
        DistributionItem::class => 'distribution',
        Expense::class => 'point_of_sale',
        ExpenseCategory::class => 'point_of_sale',
        Feedback::class => 'feedback',
        Patient::class => 'patients',
        PatientAllergy::class => 'patients',
        PatientMedicalCondition::class => 'patients',
        PatientMedication::class => 'patients',
        PatientVisit::class => 'patients',
        PatientVisitDiagnosis::class => 'patients',
        PatientVisitPrescription::class => 'patients',
        PatientVisitProduct::class => 'patients',
        PatientVisitService::class => 'patients',
        Product::class => 'inventory',
        Sale::class => 'point_of_sale',
        SaleProductItem::class => 'point_of_sale',
        SaleReturn::class => 'point_of_sale',
        SaleReturnItem::class => 'point_of_sale',
        SaleServiceItem::class => 'point_of_sale',
        Service::class => 'services',
        StaffAccount::class => 'staff',
        SystemSetting::class => 'system_settings',
        SystemNotification::class => 'notifications',
        User::class => 'staff',
    ];

    /** @var array<string, string> */
    private const READ_ROUTE_CONTEXTS = [
        'appointments.index' => 'appointments',
        'branches.index' => 'branches',
        'categories.index' => 'categories',
        'distributions.index' => 'distribution',
        'feedback.index' => 'feedback',
        'inventory.index' => 'inventory',
        'patient.feedback.index' => 'feedback',
        'patients.index' => 'patients',
        'patients.show' => 'patients',
        'pos.index' => 'point_of_sale',
        'pos.sales.receipt' => 'point_of_sale',
        'reports.export' => 'reports',
        'reports.index' => 'reports',
        'reports.print.branch-sales' => 'reports',
        'reports.print.sales' => 'reports',
        'services.index' => 'services',
        'staff.index' => 'staff',
        'system-settings.index' => 'system_settings',
    ];

    /** @var list<string> */
    private const SENSITIVE_FRAGMENTS = [
        'password',
        'remember_token',
        'secret',
        'recovery_code',
        'token',
    ];

    public function listen(): void
    {
        foreach (['created', 'updated', 'deleted', 'restored'] as $action) {
            Event::listen("eloquent.{$action}: *", function (string $eventName, array $payload) use ($action): void {
                $model = $payload[0] ?? null;

                if ($model instanceof Model) {
                    $this->recordModelAction($action, $model);
                }
            });
        }
    }

    public function recordRead(Request $request): void
    {
        $routeName = $request->route()?->getName();
        $context = is_string($routeName) ? self::READ_ROUTE_CONTEXTS[$routeName] ?? null : null;

        if ($context === null) {
            return;
        }

        $subject = collect($request->route()->parameters())
            ->first(fn (mixed $parameter): bool => $parameter instanceof Model);
        $subjectType = $subject instanceof Model ? class_basename($subject) : 'Module';
        $subjectId = $subject instanceof Model ? (string) $subject->getKey() : null;
        $subjectLabel = $subject instanceof Model
            ? $this->subjectLabel($subject)
            : ActivityLog::contextLabels()[$context];

        ActivityLog::query()->create([
            ...$this->actorData($request),
            'action' => 'viewed',
            'context' => $context,
            'subject_type' => $subjectType,
            'subject_ID' => $subjectId,
            'subject_label' => $subjectLabel,
            'description' => "Viewed {$subjectLabel}.",
            'old_values' => null,
            'new_values' => null,
            ...$this->requestData($request),
        ]);
    }

    private function recordModelAction(string $action, Model $model): void
    {
        if ($model instanceof ActivityLog) {
            return;
        }

        [$oldValues, $newValues] = $this->snapshots($action, $model);

        if ($action === 'updated' && $oldValues === [] && $newValues === []) {
            return;
        }

        $request = app()->runningInConsole() ? null : request();
        $subjectType = Str::headline(class_basename($model));
        $subjectLabel = $this->subjectLabel($model);

        ActivityLog::query()->create([
            ...$this->actorData($request),
            'action' => $action,
            'context' => self::MODEL_CONTEXTS[$model::class] ?? 'general',
            'subject_type' => $subjectType,
            'subject_ID' => $model->getKey() === null ? null : (string) $model->getKey(),
            'subject_label' => $subjectLabel,
            'description' => $this->description($action, $subjectType, $subjectLabel, $newValues),
            'old_values' => $oldValues === [] ? null : $oldValues,
            'new_values' => $newValues === [] ? null : $newValues,
            ...$this->requestData($request),
        ]);
    }

    /** @return array{array<string, mixed>, array<string, mixed>} */
    private function snapshots(string $action, Model $model): array
    {
        if ($action === 'created') {
            return [[], $this->sanitizeSnapshot($model->getAttributes())];
        }

        if ($action === 'deleted') {
            return [$this->sanitizeSnapshot($model->getAttributes()), []];
        }

        if ($action === 'restored') {
            return [[], $this->sanitizeSnapshot($model->getAttributes())];
        }

        $changes = collect($model->getChanges())
            ->except(['created_at', 'updated_at', 'deleted_at'])
            ->all();
        $original = array_intersect_key($model->getRawOriginal(), $changes);

        return [
            $this->sanitizeSnapshot($original),
            $this->sanitizeSnapshot($changes),
        ];
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function sanitizeSnapshot(array $values): array
    {
        return collect($values)
            ->except(['created_at', 'updated_at', 'deleted_at'])
            ->mapWithKeys(function (mixed $value, string $key): array {
                if ($this->isSensitive($key)) {
                    return [$key => '[REDACTED]'];
                }

                if (is_resource($value)) {
                    return [$key => '[BINARY DATA]'];
                }

                return [$key => $value];
            })
            ->all();
    }

    private function isSensitive(string $attribute): bool
    {
        return collect(self::SENSITIVE_FRAGMENTS)
            ->contains(fn (string $fragment): bool => str_contains(Str::lower($attribute), $fragment));
    }

    private function subjectLabel(Model $model): string
    {
        if ($model instanceof Patient || $model instanceof StaffAccount) {
            return Str::limit($model->full_name, 100);
        }

        foreach (['branch_name', 'invoice_number', 'name', 'title', 'category_name', 'service_name', 'product_name', 'email'] as $attribute) {
            $value = $model->getAttribute($attribute);

            if (is_string($value) && $value !== '') {
                return Str::limit($value, 100);
            }
        }

        return Str::headline(class_basename($model)).' #'.($model->getKey() ?? 'new');
    }

    /** @param array<string, mixed> $newValues */
    private function description(
        string $action,
        string $subjectType,
        string $subjectLabel,
        array $newValues,
    ): string {
        $changedFields = $action === 'updated'
            ? ' ('.collect(array_keys($newValues))->map(fn (string $field): string => Str::headline($field))->implode(', ').')'
            : '';

        return Str::ucfirst($action)." {$subjectType} \"{$subjectLabel}\"{$changedFields}.";
    }

    /** @return array<string, int|string|null> */
    private function actorData(?Request $request): array
    {
        $routeName = $request?->route()?->getName();
        $patient = is_string($routeName) && str_starts_with($routeName, 'patient.')
            ? Auth::guard('patient')->user()
            : null;
        $actor = $patient ?? $this->webActor() ?? $this->patientActor();

        if ($actor instanceof Patient) {
            return [
                'actor_type' => 'patient',
                'actor_ID' => $actor->PID,
                'actor_name' => $actor->full_name,
                'actor_email' => $actor->email,
                'actor_role' => 'patient',
                'actor_branch_ID' => null,
            ];
        }

        if ($actor instanceof StaffAccount) {
            return [
                'actor_type' => 'staff',
                'actor_ID' => $actor->account_ID,
                'actor_name' => $actor->full_name,
                'actor_email' => $actor->email,
                'actor_role' => $actor->roleKey()?->value,
                'actor_branch_ID' => $actor->branch_ID,
            ];
        }

        if ($actor instanceof User) {
            return [
                'actor_type' => 'staff',
                'actor_ID' => $actor->id,
                'actor_name' => $actor->name,
                'actor_email' => $actor->email,
                'actor_role' => 'super_admin',
                'actor_branch_ID' => null,
            ];
        }

        return [
            'actor_type' => 'system',
            'actor_ID' => null,
            'actor_name' => 'System',
            'actor_email' => null,
            'actor_role' => null,
            'actor_branch_ID' => $this->subjectBranchIdFromRequest($request),
        ];
    }

    /** @return array<string, string|null> */
    private function requestData(?Request $request): array
    {
        if ($request === null) {
            return [
                'request_method' => null,
                'route_name' => null,
                'url' => null,
                'ip_address' => null,
                'user_agent' => null,
            ];
        }

        return [
            'request_method' => $request->method(),
            'route_name' => $request->route()?->getName(),
            'url' => '/'.ltrim($request->path(), '/'),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000),
        ];
    }

    private function subjectBranchIdFromRequest(?Request $request): ?int
    {
        if ($request === null) {
            return null;
        }

        $branchId = $request->integer('branch_ID');

        return $branchId > 0 ? $branchId : null;
    }

    private function webActor(): mixed
    {
        return Auth::guard('web')->user();
    }

    private function patientActor(): mixed
    {
        return Auth::guard('patient')->user();
    }
}
