import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    UserPlus,
} from 'lucide-react';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import { index as appointmentsIndex } from '@/routes/appointments';
import { index as branchesIndex } from '@/routes/branches';
import { index as inventoryIndex } from '@/routes/inventory';
import { show as patientShow } from '@/routes/patients';
import { index as servicesIndex } from '@/routes/services';
import { index as staffIndex } from '@/routes/staff';
import type {
    Auth,
    DashboardAppointment,
    DashboardCalendar,
    DashboardFilters,
    DashboardWelcome,
} from '@/types';

type DashboardProps = {
    welcome: DashboardWelcome;
    branches: Array<{ branch_ID: number; branch_name: string }>;
    filters: DashboardFilters;
    calendar: DashboardCalendar;
    selected_appointments: DashboardAppointment[];
};

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function Dashboard({
    welcome,
    branches,
    filters,
    calendar,
    selected_appointments: selectedAppointments,
}: DashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    usePoll(60_000, {
        only: ['calendar', 'selected_appointments'],
    });

    const visit = (changes: Partial<DashboardFilters>) => {
        const next = { ...filters, ...changes };
        router.get(
            dashboard.url(),
            {
                month: next.month,
                date: next.date,
                branch_ID: next.branch_ID ?? undefined,
            },
            {
                only: ['calendar', 'selected_appointments', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const changeMonth = (offset: number) => {
        const current = new Date(`${filters.month}-01T00:00:00`);
        current.setMonth(current.getMonth() + offset);
        const month = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        visit({ month, date: `${month}-01` });
    };

    const showQuickActions =
        auth.user?.role.name === 'super_admin' ||
        auth.user?.role.name === 'admin';
    const quickActions = [
        {
            label: 'Add Branch',
            module: 'branches' as const,
            href: branchesIndex({ query: { action: 'create' } }),
            icon: Building2,
        },
        {
            label: 'Add Staff',
            module: 'staff' as const,
            href: staffIndex({ query: { action: 'create' } }),
            icon: UserPlus,
        },
        {
            label: 'Add Appointment',
            module: 'appointments' as const,
            href: appointmentsIndex({ query: { action: 'create' } }),
            icon: CalendarClock,
        },
        {
            label: 'Add Product',
            module: 'inventory' as const,
            href: inventoryIndex({ query: { action: 'create' } }),
            icon: Boxes,
        },
        {
            label: 'Add Service',
            module: 'services' as const,
            href: servicesIndex({ query: { action: 'create' } }),
            icon: Sparkles,
        },
    ].filter((action) => auth.permissions.modules.includes(action.module));

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6 lg:p-8">
                <section className="relative min-h-32 overflow-hidden rounded-xl border bg-primary shadow-sm">
                    {welcome.banner_image_url && (
                        <img
                            src={welcome.banner_image_url}
                            alt=""
                            className="absolute inset-0 size-full object-cover object-center"
                        />
                    )}
                    <div className="absolute inset-0 bg-primary/75" />
                    <div className="relative flex min-h-32 items-center p-6 text-primary-foreground">
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl">
                                Welcome back,{' '}
                                <span className="font-bold">
                                    {welcome.name}
                                </span>{' '}
                                🌿
                            </h1>
                            <p className="mt-2 text-sm text-primary-foreground/85 sm:text-base md:text-lg">
                                Let&apos;s continue delivering excellence at{' '}
                                {welcome.business_name}
                                {welcome.branch_name
                                    ? ` — ${welcome.branch_name}`
                                    : ''}
                                !
                            </p>
                        </div>
                    </div>
                </section>

                {showQuickActions && quickActions.length > 0 && (
                    <section
                        aria-label="Quick actions"
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
                    >
                        {quickActions.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={label}
                                href={href}
                                className="group flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-sm transition-colors hover:bg-accent"
                            >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                    <Icon className="size-5" />
                                </span>
                                <span className="text-sm font-medium">
                                    {label}
                                </span>
                            </Link>
                        ))}
                    </section>
                )}

                <section className="grid min-h-[580px] gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
                    <Card className="min-h-[480px] gap-0 py-0">
                        <CardHeader className="gap-4 border-b py-5">
                            <div className="flex items-center justify-between gap-3">
                                <CardTitle>Appointments</CardTitle>
                                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                    <CalendarClock className="size-5" />
                                </span>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-sm text-muted-foreground">
                                    {isToday(filters.date) ? 'Today — ' : ''}
                                    <span className="font-medium text-foreground">
                                        {formatDate(filters.date)}
                                    </span>
                                </p>
                                <p className="mt-1 text-3xl font-semibold tabular-nums">
                                    {selectedAppointments.length}
                                </p>
                            </div>
                            {filters.can_view_all_branches && (
                                <Select
                                    value={
                                        filters.branch_ID === null
                                            ? 'all'
                                            : String(filters.branch_ID)
                                    }
                                    onValueChange={(value) =>
                                        visit({
                                            branch_ID:
                                                value === 'all'
                                                    ? null
                                                    : Number(value),
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All branches" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All branches
                                        </SelectItem>
                                        {branches.map((branch) => (
                                            <SelectItem
                                                key={branch.branch_ID}
                                                value={String(branch.branch_ID)}
                                            >
                                                {branch.branch_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 px-0 py-2">
                            {selectedAppointments.length > 0 ? (
                                <div className="divide-y">
                                    {selectedAppointments.map((appointment) => (
                                        <Link
                                            key={appointment.appointment_ID}
                                            href={patientShow(appointment.PID)}
                                            className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {appointment.patient_name}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {appointment.time}
                                                    {filters.can_view_all_branches
                                                        ? ` · ${appointment.branch_name}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <span
                                                className={`size-2.5 shrink-0 rounded-full ${appointment.status === 'today' ? 'bg-blue-500' : 'bg-primary'}`}
                                                title={
                                                    appointment.status ===
                                                    'today'
                                                        ? "Today's appointment"
                                                        : 'Upcoming appointment'
                                                }
                                            />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                                    <CalendarClock className="size-12 opacity-40" />
                                    <p className="text-sm">
                                        No appointments scheduled
                                    </p>
                                    <p className="text-xs">
                                        {formatDate(filters.date)}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="min-h-[480px] gap-0 py-0">
                        <CardHeader className="border-b py-5">
                            <div className="flex items-center justify-center gap-4">
                                <TooltipIconButton
                                    type="button"
                                    size="icon"
                                    tooltip="Previous month"
                                    onClick={() => changeMonth(-1)}
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft />
                                </TooltipIconButton>
                                <CardTitle className="min-w-48 text-center text-xl">
                                    {calendar.month_name} {calendar.year}
                                </CardTitle>
                                <TooltipIconButton
                                    type="button"
                                    size="icon"
                                    tooltip="Next month"
                                    onClick={() => changeMonth(1)}
                                    aria-label="Next month"
                                >
                                    <ChevronRight />
                                </TooltipIconButton>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6">
                            <div className="grid grid-cols-7">
                                {weekdays.map((day) => (
                                    <div
                                        key={day}
                                        className="py-2 text-center text-xs font-semibold sm:text-sm"
                                    >
                                        <span className="hidden sm:inline">
                                            {day}
                                        </span>
                                        <span className="sm:hidden">
                                            {day.slice(0, 2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                {calendar.days.map((day) => {
                                    const selected = filters.date === day.date;

                                    return (
                                        <button
                                            key={day.date}
                                            type="button"
                                            disabled={!day.is_current_month}
                                            onClick={() =>
                                                visit({ date: day.date })
                                            }
                                            className={`relative flex h-16 items-center justify-center rounded-lg border text-sm transition-colors sm:h-20 ${!day.is_current_month ? 'pointer-events-none opacity-30' : 'hover:bg-muted'} ${selected ? 'border-primary bg-primary/10 ring-2 ring-primary' : day.is_today ? 'bg-muted' : ''}`}
                                        >
                                            <span
                                                className={`font-semibold ${selected ? 'text-primary' : ''}`}
                                            >
                                                {day.day}
                                            </span>
                                            {day.appointment_count > 0 &&
                                                day.date >= todayKey() && (
                                                    <span className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                                        {day.appointment_count}
                                                    </span>
                                                )}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function todayKey() {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function isToday(value: string) {
    return value === todayKey();
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
