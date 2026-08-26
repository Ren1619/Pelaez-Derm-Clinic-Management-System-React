import { Form, Head, Link } from '@inertiajs/react';
import { LockKeyhole, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home, register } from '@/routes';
import { store } from '@/routes/account/login';
import { request as requestVerification } from '@/routes/account/verification';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const [lockoutSeconds, setLockoutSeconds] = useState(0);

    useEffect(() => {
        if (lockoutSeconds <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setLockoutSeconds((seconds) => Math.max(seconds - 1, 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [lockoutSeconds]);

    return (
        <>
            <Head title="Log in" />

            <div className="mb-3">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={home()}>Back to home</Link>
                </Button>
            </div>
            {status && (
                <div
                    role="status"
                    className="mb-5 border border-emerald-600/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-700 dark:text-emerald-300"
                >
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                noValidate
                resetOnSuccess={['password']}
                className="mx-auto flex max-w-md flex-col gap-5"
                onError={(errors) => {
                    const seconds = Number(errors.lockout_seconds ?? 0);

                    if (Number.isFinite(seconds) && seconds > 0) {
                        setLockoutSeconds(Math.ceil(seconds));
                    }
                }}
            >
                {({ processing, errors }) => (
                    <>
                        <p className="text-sm text-foreground">
                            All fields with{' '}
                            <span
                                className="text-destructive"
                                aria-hidden="true"
                            >
                                *
                            </span>{' '}
                            are required.
                        </p>

                        {errors.email && (
                            <div
                                role="alert"
                                className="flex items-center justify-between gap-4 border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                            >
                                <span>{errors.email}</span>
                                {errors.unverified === '1' && (
                                    <TextLink
                                        href={requestVerification()}
                                        className="shrink-0 text-xs font-semibold"
                                    >
                                        Resend verification
                                    </TextLink>
                                )}
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="email">
                                Email{' '}
                                <span
                                    className="text-destructive"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoFocus
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="h-11 pl-10"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="password">
                                    Password{' '}
                                    <span
                                        className="text-destructive"
                                        aria-hidden="true"
                                    >
                                        *
                                    </span>
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs sm:text-sm"
                                    >
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>
                            <div className="relative">
                                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox id="remember" name="remember" />
                            <Label
                                htmlFor="remember"
                                className="text-sm font-normal"
                            >
                                Keep me signed in
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="h-11 w-full font-semibold"
                            disabled={processing || lockoutSeconds > 0}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            {lockoutSeconds > 0
                                ? 'Too many attempts'
                                : 'Log in'}
                        </Button>

                        <p className="border-t border-foreground/10 pt-4 text-center text-sm text-muted-foreground">
                            No account yet?{' '}
                            <TextLink
                                href={register()}
                                className="font-semibold text-primary"
                            >
                                Sign up
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
};







