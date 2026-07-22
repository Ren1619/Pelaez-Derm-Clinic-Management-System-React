import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    LayoutList,
    Pencil,
    Plus,
    Search,
    Stethoscope,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import Heading from '@/components/heading';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { destroy, index } from '@/routes/appointments';
import type {
    Appointment,
    AppointmentFilters,
    AppointmentOptions,
    AppointmentPaginator,
    AppointmentStatus,
} from '@/types';
import { AppointmentDialog } from './components/appointment-dialog';

type Props = AppointmentOptions & {
    appointments: AppointmentPaginator;
    calendarAppointments: Appointment[];
    summary: Record<AppointmentStatus, number>;
    filters: AppointmentFilters;
};

const statuses: Array<{ value: AppointmentStatus | 'all'; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'pending', label: 'Pending' },
    { value: 'reschedule_requested', label: 'Awaiting Patient' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'incomplete', label: 'Incomplete' },
];

export default function AppointmentsIndex(props: Props) {
    const { appointments, calendarAppointments, summary, filters } = props;
    const [search, setSearch] = useState(filters.search);
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [dialogOpen, setDialogOpen] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('action') ===
                'create',
    );
    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>(
        'create',
    );
    const [selected, setSelected] = useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState(() =>
        localDateKey(new Date()),
    );

    const visit = (changes: Partial<AppointmentFilters>, only?: string[]) => {
        const next = { ...filters, ...changes };
        router.get(
            index.url(),
            {
                status: next.status,
                branch_ID: next.branch_ID ?? undefined,
                appointment_type: next.appointment_type,
                search: next.search || undefined,
                month: next.month,
                per_page: next.per_page,
            },
            { preserveState: true, preserveScroll: true, replace: true, only },
        );
    };

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timer = window.setTimeout(
            () => visit({ search }, ['appointments', 'filters']),
            350,
        );

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openDialog = (
        mode: 'create' | 'edit' | 'view',
        appointment: Appointment | null = null,
    ) => {
        setDialogMode(mode);
        setSelected(appointment);
        setDialogOpen(true);
    };

    const monthDate = useMemo(
        () => new Date(`${filters.month}-01T00:00:00`),
        [filters.month],
    );
    const calendarDays = useMemo(
        () => buildCalendarDays(monthDate),
        [monthDate],
    );
    const dayAppointments = calendarAppointments.filter(
        (appointment) =>
            localDateKey(new Date(appointment.scheduled_at)) === selectedDate,
    );

    const changeMonth = (offset: number) => {
        const next = new Date(monthDate);
        next.setMonth(next.getMonth() + offset);
        const month = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
        setSelectedDate(`${month}-01`);
        visit({ month }, ['calendarAppointments', 'filters']);
    };

    return (
        <>
            <Head title="Appointments" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Appointment management"
                        description="Schedule clinic bookings and start each appointment as a connected patient visit."
                    />
                    <Button onClick={() => openDialog('create')}>
                        <Plus /> Add appointment
                    </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
                    {statuses.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => visit({ status: value })}
                            className={`rounded-xl border p-4 text-left transition-colors ${filters.status === value ? 'border-foreground bg-accent' : 'bg-card hover:bg-accent/50'}`}
                        >
                            <span className="text-sm text-muted-foreground">
                                {label}
                            </span>
                            <span className="mt-2 block text-2xl font-semibold">
                                {summary[value as AppointmentStatus]}
                            </span>
                        </button>
                    ))}
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search patient, concern, or service…"
                                    className="pl-9"
                                />
                            </div>
                            <Select
                                value={
                                    filters.branch_ID
                                        ? String(filters.branch_ID)
                                        : 'all'
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
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="All clinics" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All clinics
                                    </SelectItem>
                                    {props.branches.map((branch) => (
                                        <SelectItem
                                            key={branch.branch_ID}
                                            value={String(branch.branch_ID)}
                                        >
                                            {branch.branch_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.appointment_type}
                                onValueChange={(value) =>
                                    visit({
                                        appointment_type:
                                            value as AppointmentFilters['appointment_type'],
                                    })
                                }
                            >
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All types
                                    </SelectItem>
                                    <SelectItem value="consultation">
                                        Consultation
                                    </SelectItem>
                                    <SelectItem value="service">
                                        Service
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-fit shrink-0 rounded-md border p-1">
                            <Button
                                size="sm"
                                variant={
                                    view === 'list' ? 'secondary' : 'ghost'
                                }
                                onClick={() => setView('list')}
                            >
                                <LayoutList /> List
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    view === 'calendar' ? 'secondary' : 'ghost'
                                }
                                onClick={() => setView('calendar')}
                            >
                                <CalendarDays /> Calendar
                            </Button>
                        </div>
                    </div>

                    {view === 'list' ? (
                        <AppointmentTable
                            appointments={appointments.data}
                            onView={(item) => openDialog('view', item)}
                            onEdit={(item) => openDialog('edit', item)}
                        />
                    ) : (
                        <div className="grid min-h-[36rem] lg:grid-cols-[20rem_1fr]">
                            <div className="border-b p-4 lg:border-r lg:border-b-0">
                                <h3 className="font-semibold">
                                    {formatDate(selectedDate)}
                                </h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    {dayAppointments.length} appointment
                                    {dayAppointments.length === 1 ? '' : 's'}
                                </p>
                                <div className="space-y-3">
                                    {dayAppointments.map((appointment) => (
                                        <button
                                            key={appointment.appointment_ID}
                                            type="button"
                                            onClick={() =>
                                                openDialog('view', appointment)
                                            }
                                            className="w-full rounded-lg border p-3 text-left hover:bg-accent"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">
                                                    {appointment.patient_name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize"
                                                >
                                                    {appointment.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {formatTime(
                                                    appointment.scheduled_at,
                                                )}{' '}
                                                · {appointment.appointment_type}
                                            </p>
                                        </button>
                                    ))}
                                    {dayAppointments.length === 0 && (
                                        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                            No appointments for this date.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 md:p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => changeMonth(-1)}
                                    >
                                        <ChevronLeft />
                                    </Button>
                                    <h3 className="text-lg font-semibold">
                                        {monthDate.toLocaleDateString([], {
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </h3>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => changeMonth(1)}
                                    >
                                        <ChevronRight />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-7 border-t border-l text-center text-xs text-muted-foreground">
                                    {[
                                        'Sun',
                                        'Mon',
                                        'Tue',
                                        'Wed',
                                        'Thu',
                                        'Fri',
                                        'Sat',
                                    ].map((day) => (
                                        <div
                                            key={day}
                                            className="border-r border-b p-2 font-medium"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 border-l">
                                    {calendarDays.map((day) => {
                                        const key = localDateKey(day.date);
                                        const count =
                                            calendarAppointments.filter(
                                                (item) =>
                                                    localDateKey(
                                                        new Date(
                                                            item.scheduled_at,
                                                        ),
                                                    ) === key,
                                            ).length;

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedDate(key)
                                                }
                                                className={`min-h-20 border-r border-b p-2 text-left hover:bg-accent ${!day.inMonth ? 'text-muted-foreground/50' : ''} ${selectedDate === key ? 'bg-accent' : ''}`}
                                            >
                                                <span className="text-sm">
                                                    {day.date.getDate()}
                                                </span>
                                                {count > 0 && (
                                                    <span className="mt-2 block rounded-md bg-secondary px-2 py-1 text-xs">
                                                        {count} booking
                                                        {count === 1 ? '' : 's'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'list' && (
                        <Pagination
                            paginator={appointments}
                            filters={filters}
                            visit={visit}
                        />
                    )}
                </Card>
            </div>

            <AppointmentDialog
                key={`${dialogMode}-${selected?.appointment_ID ?? 'new'}-${dialogOpen}`}
                appointment={selected}
                mode={dialogMode}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onEdit={(appointment) => openDialog('edit', appointment)}
                branches={props.branches}
                patients={props.patients}
                doctors={props.doctors}
                services={props.services}
                timeSlots={props.timeSlots}
            />
        </>
    );
}

function AppointmentTable({
    appointments,
    onView,
    onEdit,
}: {
    appointments: Appointment[];
    onView: (appointment: Appointment) => void;
    onEdit: (appointment: Appointment) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                    <tr>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Booking</th>
                        <th className="px-4 py-3">Schedule</th>
                        <th className="px-4 py-3">Clinic / doctor</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {appointments.map((appointment) => (
                        <ClickableTableRow
                            key={appointment.appointment_ID}
                            className="border-t"
                            accessibleLabel={`View ${appointment.patient_name}'s appointment`}
                            onActivate={() => onView(appointment)}
                        >
                            <td className="px-4 py-4">
                                <span className="font-medium">
                                    {appointment.patient_name}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    {appointment.patient_contact}
                                </p>
                            </td>
                            <td className="max-w-xs px-4 py-4">
                                <span className="capitalize">
                                    {appointment.appointment_type}
                                </span>
                                <p className="truncate text-xs text-muted-foreground">
                                    {appointment.appointment_type ===
                                    'consultation'
                                        ? appointment.concern
                                        : appointment.services
                                              .map((item) => item.service_name)
                                              .join(', ')}
                                </p>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div>
                                    {new Date(
                                        appointment.scheduled_at,
                                    ).toLocaleDateString([], {
                                        dateStyle: 'medium',
                                    })}
                                </div>
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock3 className="size-3" />
                                    {formatTime(appointment.scheduled_at)}
                                </p>
                            </td>
                            <td className="px-4 py-4">
                                <div>{appointment.branch_name}</div>
                                <p className="text-xs text-muted-foreground">
                                    {appointment.doctor_name ??
                                        'Doctor unassigned'}
                                </p>
                            </td>
                            <td className="px-4 py-4">
                                <Badge variant="outline" className="capitalize">
                                    {appointment.status}
                                </Badge>
                                {appointment.visit_ID && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Stethoscope className="size-3" /> Visit
                                        #{appointment.visit_ID}
                                    </p>
                                )}
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex justify-end gap-1">
                                    {appointment.can_edit && (
                                        <TooltipIconButton
                                            variant="ghost"
                                            size="icon"
                                            tooltip={`Edit ${appointment.patient_name}'s appointment`}
                                            onClick={() => onEdit(appointment)}
                                        >
                                            <Pencil />
                                        </TooltipIconButton>
                                    )}
                                    {appointment.visit_ID === null &&
                                        ['pending', 'cancelled'].includes(
                                            appointment.status,
                                        ) && (
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                tooltip={`Delete ${appointment.patient_name}'s appointment`}
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            `Delete ${appointment.patient_name}'s appointment?`,
                                                        )
                                                    ) {
                                                        router.delete(
                                                            destroy.url(
                                                                appointment,
                                                            ),
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }
                                                }}
                                            >
                                                <Trash2 />
                                            </TooltipIconButton>
                                        )}
                                </div>
                            </td>
                        </ClickableTableRow>
                    ))}
                    {appointments.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="p-12 text-center text-muted-foreground"
                            >
                                No appointments match these filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function Pagination({
    paginator,
    filters,
    visit,
}: {
    paginator: AppointmentPaginator;
    filters: AppointmentFilters;
    visit: (changes: Partial<AppointmentFilters>, only?: string[]) => void;
}) {
    return (
        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {paginator.from ?? 0}–{paginator.to ?? 0} of{' '}
                {paginator.total}
            </p>
            <div className="flex items-center gap-2">
                <Select
                    value={String(filters.per_page)}
                    onValueChange={(value) =>
                        visit({ per_page: Number(value) })
                    }
                >
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page <= 1}
                    onClick={() =>
                        router.get(
                            index.url(),
                            { ...filters, page: paginator.current_page - 1 },
                            { preserveState: true },
                        )
                    }
                >
                    Previous
                </Button>
                <span className="text-sm">
                    {paginator.current_page} / {paginator.last_page}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page >= paginator.last_page}
                    onClick={() =>
                        router.get(
                            index.url(),
                            { ...filters, page: paginator.current_page + 1 },
                            { preserveState: true },
                        )
                    }
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

function buildCalendarDays(month: Date) {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    start.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);

        return { date, inMonth: date.getMonth() === month.getMonth() };
    });
}

const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
const localDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
