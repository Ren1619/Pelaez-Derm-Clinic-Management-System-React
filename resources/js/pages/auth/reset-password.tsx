import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { Check, Circle } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = {
    accountType: 'staff' | 'patient';
    token: string;
    email: string;
    isAccountSetup?: boolean;
    passwordRules: string;
};

type PasswordRequirement = {
    label: string;
    isMet: boolean;
};

/** Displays password requirements and updates them while the user types. */
function PasswordRequirements({ password }: { password: string }) {
    const requirements: PasswordRequirement[] = [
        { label: 'At least 8 characters long', isMet: password.length >= 8 },
        {
            label: 'At least one uppercase letter',
            isMet: /[A-Z]/.test(password),
        },
        {
            label: 'At least one lowercase letter',
            isMet: /[a-z]/.test(password),
        },
        { label: 'At least one number', isMet: /\d/.test(password) },
        {
            label: 'At least one special character',
            isMet: /[^A-Za-z0-9\s]/.test(password),
        },
    ];

    return (
        <div
            className="grid gap-2 text-left"
            aria-live="polite"
            aria-label="Password requirements"
        >
            <p className="text-sm font-medium">Password must include:</p>
            <ul className="grid gap-2">
                {requirements.map((requirement) => {
                    const RequirementIcon = requirement.isMet ? Check : Circle;

                    return (
                        <li
                            key={requirement.label}
                            className={`flex items-center gap-2 text-sm ${
                                requirement.isMet
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            <RequirementIcon
                                className="size-4 shrink-0"
                                aria-hidden="true"
                            />
                            <span>{requirement.label}</span>
                            <span className="sr-only">
                                {requirement.isMet ? ' met' : ' not met'}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/**
 * Resets a password through the broker selected by the signed email link.
 */
export default function ResetPassword({
    accountType,
    token,
    email,
    isAccountSetup = false,
    passwordRules,
}: Props) {
    const [password, setPassword] = useState('');
    const pageTitle = isAccountSetup
        ? 'Create your password'
        : 'Reset password';
    const pageDescription = isAccountSetup
        ? 'Your email is verified. Create a password to finish setting up your account.'
        : 'Please enter your new password below';

    // Keep the shared auth layout consistent with how the user reached this form.
    setLayoutProps({ title: pageTitle, description: pageDescription });

    return (
        <>
            <Head title={pageTitle} />

            <Form
                {...update.form()}
                // Hidden routing values keep the visible form simple and read-only.
                transform={(data) => ({
                    ...data,
                    account_type: accountType,
                    token,
                    email,
                    account_setup: isAccountSetup,
                })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <p className="text-sm text-foreground">
                            All fields with{' '}
                            <span className="text-primary" aria-hidden="true">
                                *
                            </span>{' '}
                            are required.
                        </p>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="mt-1 block w-full"
                                readOnly
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                Password
                                <span
                                    className="text-primary"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Password"
                                passwordrules={passwordRules}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />
                            <InputError message={errors.password} />
                        </div>

                        <PasswordRequirements password={password} />

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
                                <span
                                    className="text-primary"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirm password"
                                passwordrules={passwordRules}
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            {isAccountSetup
                                ? 'Create password'
                                : 'Reset password'}
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
