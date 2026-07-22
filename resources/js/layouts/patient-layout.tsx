import { Form, Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    FileHeart,
    LogOut,
    Menu,
    MessageSquareText,
    Sparkles,
    X,
} from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { SystemNotificationBell } from '@/components/system-notification-bell';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { logout } from '@/routes/patient';
import { index as appointmentsIndex } from '@/routes/patient/appointments';
import { index as feedbackIndex } from '@/routes/patient/feedback';
import { index as healthRecordIndex } from '@/routes/patient/health-record';
import { index as servicesIndex } from '@/routes/patient/services';

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
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);
    const links = [
        { label: 'Health Record', href: healthRecordIndex(), icon: FileHeart },
        {
            label: 'Appointments',
            href: appointmentsIndex(),
            icon: CalendarDays,
        },
        { label: 'Services', href: servicesIndex(), icon: Sparkles },
        { label: 'Feedback', href: feedbackIndex(), icon: MessageSquareText },
    ];
    const current = links.find((link) => url.startsWith(link.href.url));

    return (
        <div className="min-h-svh bg-muted/30 lg:pl-64">
            {menuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-20 items-center justify-between border-b px-5">
                    <Link
                        href={healthRecordIndex()}
                        className="flex items-center gap-3 font-semibold"
                    >
                        <AppLogoIcon className="size-9 fill-current" />
                        <span>Patient Portal</span>
                    </Link>
                    <TooltipIconButton
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        tooltip="Close navigation"
                        onClick={() => setMenuOpen(false)}
                    >
                        <X className="size-5" />
                    </TooltipIconButton>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const active = url.startsWith(link.href.url);

                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-3 rounded-r-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}
                            >
                                <Icon className="size-5" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t p-4">
                    <div className="mb-3 min-w-0 px-2">
                        <p className="truncate text-sm font-medium">
                            {patient.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {patient.email}
                        </p>
                    </div>
                    <Form {...logout.form()}>
                        {({ processing }) => (
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full justify-start"
                                disabled={processing}
                            >
                                <LogOut className="size-4" /> Log out
                            </Button>
                        )}
                    </Form>
                </div>
            </aside>

            <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
                <TooltipIconButton
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    tooltip="Open navigation"
                    onClick={() => setMenuOpen(true)}
                >
                    <Menu className="size-5" />
                </TooltipIconButton>
                <h1 className="text-lg font-semibold">
                    {current?.label ?? 'Patient Portal'}
                </h1>
                <div className="ml-auto hidden text-right sm:block">
                    <p className="text-sm font-medium">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">Patient</p>
                </div>
                <SystemNotificationBell audience="patient" />
            </header>

            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
    );
}
