<?php

namespace App\Providers;

use App\Enums\AccountType;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Services\ActivityLogRecorder;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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
        $this->configureDefaults();
        $this->configurePasswordResetUrls();
        $this->app->make(ActivityLogRecorder::class)->listen();
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

    private function configurePasswordResetUrls(): void
    {
        ResetPassword::createUrlUsing(function (StaffAccount|Patient $notifiable, string $token): string {
            $accountType = $notifiable instanceof Patient
                ? AccountType::Patient
                : AccountType::Staff;

            return route('password.reset', [
                'accountType' => $accountType->value,
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);
        });
    }
}
