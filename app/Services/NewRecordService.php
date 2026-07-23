<?php

namespace App\Services;

use App\Enums\NewRecordModule;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Distribution;
use App\Models\Expense;
use App\Models\Feedback;
use App\Models\NewRecordEvent;
use App\Models\NewRecordEventRead;
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
use App\Models\Service;
use App\Models\StaffAccount;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class NewRecordService
{
    /** @var array<string, array{id: int, module: string}>|null */
    private ?array $unreadMap = null;

    /** @var array<class-string<Model>, NewRecordModule> */
    private const TrackedModels = [
        Appointment::class => NewRecordModule::Appointments,
        Patient::class => NewRecordModule::Patients,
        PatientAllergy::class => NewRecordModule::Patients,
        PatientMedicalCondition::class => NewRecordModule::Patients,
        PatientMedication::class => NewRecordModule::Patients,
        PatientVisit::class => NewRecordModule::Patients,
        PatientVisitDiagnosis::class => NewRecordModule::Patients,
        PatientVisitPrescription::class => NewRecordModule::Patients,
        PatientVisitProduct::class => NewRecordModule::Patients,
        PatientVisitService::class => NewRecordModule::Patients,
        Product::class => NewRecordModule::Inventory,
        Sale::class => NewRecordModule::PointOfSale,
        Expense::class => NewRecordModule::PointOfSale,
        Service::class => NewRecordModule::Services,
        Category::class => NewRecordModule::Categories,
        StaffAccount::class => NewRecordModule::Staff,
        Branch::class => NewRecordModule::Branches,
        Distribution::class => NewRecordModule::Distribution,
        Feedback::class => NewRecordModule::Feedback,
    ];

    public function record(Model $subject): void
    {
        $module = self::TrackedModels[$subject::class] ?? null;

        if ($module === null || ($subject instanceof Sale && ! $subject->finalized)) {
            return;
        }

        [$branchId, $secondaryBranchId] = $this->branches($subject);

        NewRecordEvent::query()->firstOrCreate([
            'subject_type' => $subject::class,
            'subject_id' => (int) $subject->getKey(),
        ], [
            'module' => $module->value,
            'branch_id' => $branchId,
            'secondary_branch_id' => $secondaryBranchId,
        ]);

        $this->unreadMap = null;
    }

    public function remove(Model $subject): void
    {
        if (! isset(self::TrackedModels[$subject::class])) {
            return;
        }

        NewRecordEvent::query()
            ->where('subject_type', $subject::class)
            ->where('subject_id', $subject->getKey())
            ->delete();

        $this->unreadMap = null;
    }

    /** @return array{is_new: bool, new_record_event_id: int|null} */
    public function metadata(Model $subject): array
    {
        $event = $this->unreadMap()[$this->subjectKey($subject)] ?? null;

        return [
            'is_new' => $event !== null,
            'new_record_event_id' => $event['id'] ?? null,
        ];
    }

    /** @return array{counts: array<string, int>, total_count: int} */
    public function summary(Authenticatable|null $viewer): array
    {
        if (! $viewer instanceof User && ! $viewer instanceof StaffAccount) {
            return ['counts' => [], 'total_count' => 0];
        }

        $counts = $this->accessibleQuery($viewer)
            ->selectRaw('module, COUNT(*) as aggregate')
            ->groupBy('module')
            ->pluck('aggregate', 'module')
            ->map(fn (mixed $count): int => (int) $count)
            ->all();

        return ['counts' => $counts, 'total_count' => array_sum($counts)];
    }

    public function markRead(Authenticatable $viewer, NewRecordEvent $event): void
    {
        abort_unless(
            ($viewer instanceof User || $viewer instanceof StaffAccount)
            && $this->accessibleQuery($viewer, includeRead: true)->whereKey($event)->exists(),
            404,
        );

        [$viewerType, $viewerId] = $this->viewer($viewer);

        NewRecordEventRead::query()->updateOrCreate([
            'new_record_event_id' => $event->id,
            'viewer_type' => $viewerType,
            'viewer_id' => $viewerId,
        ], ['seen_at' => now()]);

        $this->unreadMap = null;
    }

    /** @return array<string, array{id: int, module: string}> */
    private function unreadMap(): array
    {
        if ($this->unreadMap !== null) {
            return $this->unreadMap;
        }

        $viewer = Auth::guard('web')->user();

        if (! $viewer instanceof User && ! $viewer instanceof StaffAccount) {
            return $this->unreadMap = [];
        }

        return $this->unreadMap = $this->accessibleQuery($viewer)
            ->get(['id', 'module', 'subject_type', 'subject_id'])
            ->mapWithKeys(fn (NewRecordEvent $event): array => [
                $event->subject_type.':'.$event->subject_id => [
                    'id' => $event->id,
                    'module' => $event->module,
                ],
            ])->all();
    }

    /** @return Builder<NewRecordEvent> */
    private function accessibleQuery(User|StaffAccount $viewer, bool $includeRead = false): Builder
    {
        $modules = collect(NewRecordModule::cases())
            ->filter(fn (NewRecordModule $module): bool => $viewer instanceof User || $viewer->canAccessModule($module->staffModule()))
            ->map(fn (NewRecordModule $module): string => $module->value)
            ->all();
        [$viewerType, $viewerId] = $this->viewer($viewer);

        return NewRecordEvent::query()
            ->whereIn('module', $modules)
            ->when(! $includeRead, fn (Builder $query): Builder => $query->whereDoesntHave(
                'reads',
                fn (Builder $readQuery): Builder => $readQuery
                    ->where('viewer_type', $viewerType)
                    ->where('viewer_id', $viewerId),
            ))
            ->when($viewer instanceof StaffAccount && ! $viewer->isSuperAdmin(), function (Builder $query) use ($viewer): void {
                $query->where(function (Builder $scope) use ($viewer): void {
                    $scope->where(function (Builder $global): void {
                        $global->whereNull('branch_id')->whereNull('secondary_branch_id');
                    })->orWhere('branch_id', $viewer->branch_ID)
                        ->orWhere('secondary_branch_id', $viewer->branch_ID);
                });
            });
    }

    /** @return array{0: string, 1: int} */
    private function viewer(User|StaffAccount $viewer): array
    {
        return $viewer instanceof StaffAccount
            ? ['staff_account', $viewer->account_ID]
            : ['user', $viewer->id];
    }

    private function subjectKey(Model $subject): string
    {
        return $subject::class.':'.$subject->getKey();
    }

    /** @return array{0: int|null, 1: int|null} */
    private function branches(Model $subject): array
    {
        return match (true) {
            $subject instanceof Distribution => [$subject->from_branch_ID, $subject->to_branch_ID],
            $subject instanceof Feedback => [$subject->appointment()->value('branch_ID'), null],
            $subject instanceof Appointment,
            $subject instanceof Product,
            $subject instanceof Sale,
            $subject instanceof Expense,
            $subject instanceof StaffAccount => [$subject->getAttribute('branch_ID'), null],
            default => [null, null],
        };
    }
}
