import { Form, Link, usePage } from '@inertiajs/react';
import { LogOut, MessageSquareText } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { logout } from '@/routes/patient';
import { index as feedbackIndex } from '@/routes/patient/feedback';

type PatientPageProps = {
    patient: {
        PID: number;
        name: string;
        email: string;
    };
};

export default function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { patient } = usePage<PatientPageProps>().props;

    return (
        <div className="min-h-svh bg-muted/30">
            <header className="border-b bg-background">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <Link
                        href={feedbackIndex()}
                        className="flex items-center gap-3 font-medium"
                    >
                        <AppLogoIcon className="size-8 fill-current" />
                        <span className="hidden sm:inline">Patient Portal</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium">
                                {patient.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {patient.email}
                            </p>
                        </div>
                        <Form {...logout.form()}>
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    size="sm"
                                    disabled={processing}
                                >
                                    <LogOut className="size-4" />
                                    Log out
                                </Button>
                            )}
                        </Form>
                    </div>
                </div>
            </header>

            <nav className="border-b bg-background">
                <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
                    <Link
                        href={feedbackIndex()}
                        className="flex items-center gap-2 border-b-2 border-foreground px-2 py-3 text-sm font-medium"
                    >
                        <MessageSquareText className="size-4" />
                        Feedback
                    </Link>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
        </div>
    );
}
