<?php

namespace App\Providers;

use App\Mail\BrevoTransport;
use App\Services\ActivityLogRecorder;
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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerBrevoMailTransport();
        $this->configureDefaults();
        $this->app->make(ActivityLogRecorder::class)->listen();
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

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
