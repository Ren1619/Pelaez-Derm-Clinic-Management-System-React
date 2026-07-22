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

type ResendVerificationProps = {
    /** Generic status text that does not reveal whether an account exists. */
    status?: string;
};

/**
 * Shows the shared verification-email form for staff and patient accounts.
 */
export default function ResendVerification({
    status,
}: ResendVerificationProps) {
    return (
        <>
            <Head title="Resend verification email" />

            {status && (
                <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                    <MailCheck className="mt-0.5 size-4 shrink-0" />
                    <span>{status}</span>
                </div>
            )}

            <Form {...send.form()} className="mt-6 space-y-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                required
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <Button className="w-full" disabled={processing}>
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>
                    </>
                )}
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
                <span>Already verified? </span>
                <TextLink href={login()}>Return to log in</TextLink>
            </div>
        </>
    );
}

ResendVerification.layout = {
    title: 'Resend verification email',
    description:
        'Enter your staff or patient email address to receive a fresh secure setup link.',
};
