import { Form, Head } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { send } from '@/routes/account/verification';

type ResendVerificationProps = { status?: string };
export default function ResendVerification({
    status,
}: ResendVerificationProps) {
    return (
        <>
            <Head title="Resend verification" />
            {status && (
                <div
                    role="status"
                    className="mb-5 flex items-start gap-3 border border-emerald-600/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
                >
                    <MailCheck className="mt-0.5 size-4 shrink-0" />
                    {status}
                </div>
            )}
            <Form {...send.form()} noValidate className="grid gap-5">
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
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}Resend verification
                        </Button>
                    </>
                )}
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                Already verified?{' '}
                <TextLink href={login()}>Return to log in</TextLink>
            </p>
        </>
    );
}
ResendVerification.layout = {
    title: 'Resend verification',
    description:
        'Enter your email address to receive another verification link.',
};
