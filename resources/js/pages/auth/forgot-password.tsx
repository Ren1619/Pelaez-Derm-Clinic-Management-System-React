import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />
            {status && (
                <div
                    role="status"
                    className="mb-5 border border-emerald-600/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-700 dark:text-emerald-300"
                >
                    {status}
                </div>
            )}
            <Form {...email.form()} noValidate className="mx-auto max-w-md">
                {({ processing, errors }) => (
                    <div className="grid gap-5">
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
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="email@example.com"
                                    className="h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>
                        <Button
                            type="submit"
                            className="h-11 w-full font-semibold"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                        >
                            {processing && <Spinner />}Send reset link
                        </Button>
                        <TextLink
                            href={login()}
                            className="mx-auto inline-flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft className="size-4" />
                            Return to login
                        </TextLink>
                    </div>
                )}
            </Form>
        </>
    );
}
ForgotPassword.layout = {
    title: 'Forgot password?',
    description: 'Enter your email address and we will send a reset link.',
};
