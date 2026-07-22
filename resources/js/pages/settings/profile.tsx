import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user!;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="gap-2 border-b px-6 py-6 sm:px-8 sm:py-7">
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        <span className="text-primary">Profile</span>{' '}
                        Information
                    </h2>
                    <CardDescription className="text-base">
                        Update your account&apos;s profile information and email
                        address.
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
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="first_name">
                                        First Name
                                        <span
                                            className="text-primary"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="first_name"
                                        defaultValue={user.first_name}
                                        name="first_name"
                                        required
                                        autoComplete="given-name"
                                        className="h-11 px-4 text-base md:text-base"
                                    />

                                    <InputError message={errors.first_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="middle_name">
                                        Middle Name
                                    </Label>
                                    <Input
                                        id="middle_name"
                                        defaultValue={user.middle_name ?? ''}
                                        name="middle_name"
                                        autoComplete="additional-name"
                                        className="h-11 px-4 text-base md:text-base"
                                    />
                                    <InputError message={errors.middle_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="last_name">
                                        Last Name
                                        <span
                                            className="text-primary"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="last_name"
                                        defaultValue={user.last_name}
                                        name="last_name"
                                        required
                                        autoComplete="family-name"
                                        className="h-11 px-4 text-base md:text-base"
                                    />
                                    <InputError message={errors.last_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="contact_number">
                                        Contact Number
                                        <span
                                            className="text-primary"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="contact_number"
                                        defaultValue={user.contact_number}
                                        name="contact_number"
                                        required
                                        inputMode="numeric"
                                        autoComplete="tel"
                                        className="h-11 px-4 text-base md:text-base"
                                    />
                                    <InputError
                                        message={errors.contact_number}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        Email
                                        <span
                                            className="text-primary"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="h-11 px-4 text-base md:text-base"
                                        defaultValue={user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError message={errors.email} />
                                </div>

                                {mustVerifyEmail &&
                                    user.email_verified_at === null && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to re-send the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center pt-1">
                                    <Button
                                        size="lg"
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        {processing && <Spinner />}
                                        Save Changes
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

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
