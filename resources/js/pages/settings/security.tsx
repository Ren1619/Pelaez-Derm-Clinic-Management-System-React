import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
};

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="gap-2 border-b px-6 py-6 sm:px-8 sm:py-7">
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        <span className="text-primary">Update</span> Password
                    </h2>
                    <CardDescription className="text-base">
                        Ensure your account is using a long, random password to
                        stay secure.
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-6 py-6 sm:px-8 sm:py-7">
                    <p className="mb-5 text-sm text-foreground">
                        All fields with{' '}
                        <span className="text-primary" aria-hidden="true">
                            *
                        </span>{' '}
                        are required.
                    </p>

                    <Form
                        {...SecurityController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        Current Password
                                        <span
                                            className="text-primary"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>

                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className="h-11 px-4 pr-11 text-base md:text-base"
                                        autoComplete="current-password"
                                        placeholder="Enter current password"
                                        required
                                    />

                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New Password
                                        <span
                                            className="text-primary"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>

                                    <PasswordInput
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        className="h-11 px-4 pr-11 text-base md:text-base"
                                        autoComplete="new-password"
                                        placeholder="Enter new password"
                                        passwordrules={props.passwordRules}
                                        required
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm Password
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
                                        className="h-11 px-4 pr-11 text-base md:text-base"
                                        autoComplete="new-password"
                                        placeholder="Confirm new password"
                                        passwordrules={props.passwordRules}
                                        required
                                    />

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <div className="flex items-center pt-1">
                                    <Button
                                        size="lg"
                                        disabled={processing}
                                        data-test="update-password-button"
                                    >
                                        {processing && <Spinner />}
                                        Update Password
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
