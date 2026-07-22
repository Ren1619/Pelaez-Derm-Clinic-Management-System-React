import { Form, Head, setLayoutProps } from '@inertiajs/react';
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
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
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
