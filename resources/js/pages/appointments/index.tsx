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
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import { DataTableLayout } from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

                <DataTableLayout>
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-start">
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
                                    <TooltipIconButton
                                        size="icon"
                                        variant="outline"
                                        tooltip="Previous month"
                                        onClick={() => changeMonth(-1)}
                                    >
                                        <ChevronLeft />
                                    </TooltipIconButton>
                                    <h3 className="text-lg font-semibold">
                                        {monthDate.toLocaleDateString([], {
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </h3>
                                    <TooltipIconButton
                                        size="icon"
                                        variant="outline"
                                        tooltip="Next month"
                                        onClick={() => changeMonth(1)}
                                    >
                                        <ChevronRight />
                                    </TooltipIconButton>
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
                        <DataTablePagination
                            paginator={appointments}
                            itemLabel="appointments"
                            onPageChange={(page) =>
                                router.get(
                                    index.url(),
                                    { ...filters, page },
                                    {
                                        only: ['appointments', 'filters'],
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
                            onPerPageChange={(perPage) =>
                                visit({ per_page: perPage })
                            }
                        />
                    )}
                </DataTableLayout>
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
        <Table className="min-w-5xl">
            <TableHeader>
                <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Clinic / doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {appointments.map((appointment) => (
                    <ClickableTableRow
                        key={appointment.appointment_ID}
                        accessibleLabel={`View ${appointment.patient_name}'s appointment`}
                        onActivate={() => onView(appointment)}
                    >
                        <TableCell>
                            <span className="font-medium">
                                {appointment.patient_name}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                {appointment.patient_contact}
                            </p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                            <span className="capitalize">
                                {appointment.appointment_type}
                            </span>
                            <p className="truncate text-xs text-muted-foreground">
                                {appointment.appointment_type === 'consultation'
                                    ? appointment.concern
                                    : appointment.services
                                          .map((item) => item.service_name)
                                          .join(', ')}
                            </p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
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
                        </TableCell>
                        <TableCell>
                            <div>{appointment.branch_name}</div>
                            <p className="text-xs text-muted-foreground">
                                {appointment.doctor_name ?? 'Doctor unassigned'}
                            </p>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="capitalize">
                                {appointment.status}
                            </Badge>
                            {appointment.visit_ID && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Stethoscope className="size-3" /> Visit #
                                    {appointment.visit_ID}
                                </p>
                            )}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                    </ClickableTableRow>
                ))}
                {appointments.length === 0 && (
                    <DataTableEmptyState
                        colSpan={6}
                        title="No appointments found"
                        description="No appointments match these filters."
                    />
                )}
            </TableBody>
        </Table>
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
