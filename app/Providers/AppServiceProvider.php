<?php

namespace App\Providers;

use App\Mail\BrevoTransport;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Distribution;
use App\Models\Expense;
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
use App\Models\Service;
use App\Models\StaffAccount;
use App\Observers\NewRecordObserver;
use App\Observers\ProductObserver;
use App\Services\ActivityLogRecorder;
use App\Services\NewRecordService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(NewRecordService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerBrevoMailTransport();
        $this->configureDefaults();
        Product::observe(ProductObserver::class);
        $this->registerNewRecordObservers();
        $this->app->make(ActivityLogRecorder::class)->listen();
    }

    private function registerNewRecordObservers(): void
    {
        foreach ([
            Appointment::class,
            Patient::class,
            PatientAllergy::class,
            PatientMedicalCondition::class,
            PatientMedication::class,
            PatientVisit::class,
            PatientVisitDiagnosis::class,
            PatientVisitPrescription::class,
            PatientVisitProduct::class,
            PatientVisitService::class,
            Product::class,
            Sale::class,
            Expense::class,
            Service::class,
            Category::class,
            StaffAccount::class,
            Branch::class,
            Distribution::class,
            Feedback::class,
        ] as $model) {
            $model::observe(NewRecordObserver::class);
        }
    }

    /**
     * Register the Brevo API mail transport.
     */
    private function registerBrevoMailTransport(): void
    {
        Mail::extend('brevo', function (): BrevoTransport {
            $apiKey = (string) config('services.brevo.key');
            $senderEmail = (string) config('services.brevo.sender_email');

            if ($apiKey === '') {
                throw new InvalidArgumentException('The BREVO_API_KEY environment value is required.');
            }

            if ($senderEmail === '') {
                throw new InvalidArgumentException('The BREVO_SENDER_EMAIL environment value is required.');
            }

            return new BrevoTransport(
                $this->app->make(HttpFactory::class),
                $apiKey,
                (string) config('services.brevo.api_url', 'https://api.brevo.com/v3'),
                $senderEmail,
                (string) config('services.brevo.sender_name'),
                (int) config('services.brevo.timeout', 10),
                (int) config('services.brevo.connect_timeout', 3),
            );
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(function (): Password {
            $passwordRule = Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols();

            // Avoid the external compromised-password lookup during local development and tests.
            return app()->isProduction()
                ? $passwordRule->uncompromised()
                : $passwordRule;
        });
    }
}
