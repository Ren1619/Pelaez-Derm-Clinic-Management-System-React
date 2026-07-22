import { Form, Head, Link, router } from '@inertiajs/react';
import {
    CalendarClock,
    CalendarPlus,
    Pencil,
    Search,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
    cancel,
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/PatientAppointmentController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    Appointment,
    AppointmentPaginator,
    AppointmentStatus,
    AppointmentType,
} from '@/types';

type Props = {
    patient: { PID: number; name: string; email: string };
    appointments: AppointmentPaginator;
    summary: Record<AppointmentStatus, number>;
    todayAppointments: Appointment[];
    branches: Array<{ branch_ID: number; branch_name: string }>;
    services: Array<{ service_ID: number; name: string }>;
    timeSlots: Array<{ value: string; label: string }>;
    filters: {
        status: AppointmentStatus | 'all';
        appointment_type: AppointmentType | 'all';
        search: string;
        per_page: number;
    };
    initialServiceId: number | null;
};

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export default function PatientAppointments({
    appointments,
    summary,
    todayAppointments,
    branches,
    services,
    timeSlots,
    filters,
    initialServiceId,
}: Props) {
    const [dialog, setDialog] = useState<Appointment | 'new' | null>(
        initialServiceId ? 'new' : null,
    );
    const [cancelAppointment, setCancelAppointment] =
        useState<Appointment | null>(null);
    const [deleteAppointment, setDeleteAppointment] =
        useState<Appointment | null>(null);
    const [search, setSearch] = useState(filters.search);

    const filter = (changes: Record<string, string | number>) =>
        router.get(
            index.url(),
            { ...filters, ...changes },
            { preserveState: true, replace: true },
        );

    return (
        <>
            <Head title="My Appointments" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">
                            My Appointments
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Book a clinic visit, reschedule an upcoming
                            appointment, and review your history.
                        </p>
                    </div>
                    <Button onClick={() => setDialog('new')}>
                        <CalendarPlus /> Set Appointment
                    </Button>
                </div>

                {todayAppointments.length > 0 && (
                    <Card className="border-primary/30 bg-primary/5 p-4">
                        <div className="flex items-center gap-2 font-medium">
                            <CalendarClock className="size-5 text-primary" />{' '}
                            You have {todayAppointments.length} appointment
                            {todayAppointments.length > 1 ? 's' : ''} today
                        </div>
                        <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                            {todayAppointments.map((item) => (
                                <p key={item.appointment_ID}>
                                    {formatTime(item.scheduled_at)} ·{' '}
                                    {item.branch_name} ·{' '}
                                    {appointmentLabel(item)}
                                </p>
                            ))}
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {(
                        [
                            'today',
                            'pending',
                            'upcoming',
                            'completed',
                            'cancelled',
                            'incomplete',
                        ] as AppointmentStatus[]
                    ).map((status) => (
                        <button
                            type="button"
                            key={status}
                            onClick={() => filter({ status })}
                            className={`rounded-lg border bg-card p-3 text-left shadow-sm transition-colors ${filters.status === status ? 'border-primary ring-1 ring-primary' : ''}`}
                        >
                            <span className="text-xs text-muted-foreground capitalize">
                                {status}
                            </span>
                            <p className="mt-1 text-xl font-semibold">
                                {summary[status] ?? 0}
                            </p>
                        </button>
                    ))}
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-end">
                        <label className="grid min-w-0 flex-1 gap-1 text-sm">
                            <span className="text-muted-foreground">
                                Search appointments
                            </span>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            filter({ search });
                                        }
                                    }}
                                    className="pl-9"
                                    placeholder="Branch, service, concern, or status"
                                />
                            </div>
                        </label>
                        <FilterSelect
                            label="Appointment type"
                            value={filters.appointment_type}
                            onValueChange={(value) =>
                                filter({ appointment_type: value })
                            }
                            options={[
                                ['all', 'All types'],
                                ['consultation', 'Consultations'],
                                ['service', 'Services'],
                            ]}
                        />
                        <FilterSelect
                            label="Status"
                            value={filters.status}
                            onValueChange={(value) => filter({ status: value })}
                            options={[
                                ['all', 'All statuses'],
                                ...(
                                    [
                                        'today',
                                        'pending',
                                        'upcoming',
                                        'completed',
                                        'cancelled',
                                        'incomplete',
                                    ] as AppointmentStatus[]
                                ).map(
                                    (value) =>
                                        [value, capitalize(value)] as [
                                            string,
                                            string,
                                        ],
                                ),
                            ]}
                        />
                        <Button
                            variant="outline"
                            onClick={() => filter({ search })}
                        >
                            Search
                        </Button>
                    </div>

                    <div className="divide-y">
                        {appointments.data.map((appointment) => (
                            <AppointmentRow
                                key={appointment.appointment_ID}
                                appointment={appointment}
                                onEdit={() => setDialog(appointment)}
                                onCancel={() =>
                                    setCancelAppointment(appointment)
                                }
                                onDelete={() =>
                                    setDeleteAppointment(appointment)
                                }
                            />
                        ))}
                        {appointments.data.length === 0 && (
                            <div className="p-12 text-center text-sm text-muted-foreground">
                                No appointments match these filters.
                            </div>
                        )}
                    </div>
                    <AppointmentPagination
                        appointments={appointments}
                        filters={filters}
                    />
                </Card>
            </div>

            {dialog && (
                <AppointmentDialog
                    key={
                        dialog === 'new'
                            ? `new-${initialServiceId ?? 0}`
                            : dialog.appointment_ID
                    }
                    appointment={dialog === 'new' ? null : dialog}
                    initialServiceId={
                        dialog === 'new' ? initialServiceId : null
                    }
                    branches={branches}
                    services={services}
                    timeSlots={timeSlots}
                    open
                    onOpenChange={(open) => !open && setDialog(null)}
                />
            )}
            <CancelDialog
                appointment={cancelAppointment}
                open={cancelAppointment !== null}
                onOpenChange={(open) => !open && setCancelAppointment(null)}
            />
            <DeleteDialog
                appointment={deleteAppointment}
                open={deleteAppointment !== null}
                onOpenChange={(open) => !open && setDeleteAppointment(null)}
            />
        </>
    );
}

function AppointmentRow({
    appointment,
    onEdit,
    onCancel,
    onDelete,
}: {
    appointment: Appointment;
    onEdit: () => void;
    onCancel: () => void;
    onDelete: () => void;
}) {
    return (
        <article className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <b>{appointmentLabel(appointment)}</b>
                    <Badge
                        variant={statusVariant(appointment.status)}
                        className="capitalize"
                    >
                        {appointment.status}
                    </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                    {dateFormatter.format(new Date(appointment.scheduled_at))} ·{' '}
                    {appointment.branch_name}
                </p>
                {appointment.doctor_name && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Doctor: {appointment.doctor_name}
                    </p>
                )}
                {appointment.cancellation_reason && (
                    <p className="mt-1 text-sm text-destructive">
                        Reason: {appointment.cancellation_reason}
                    </p>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {appointment.can_edit && (
                    <Button size="sm" variant="outline" onClick={onEdit}>
                        <Pencil /> Reschedule
                    </Button>
                )}
                {appointment.can_cancel && (
                    <Button size="sm" variant="outline" onClick={onCancel}>
                        <XCircle /> Cancel
                    </Button>
                )}
                {appointment.visit_ID === null &&
                    ['completed', 'cancelled'].includes(appointment.status) && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={onDelete}
                        >
                            <Trash2 /> Delete
                        </Button>
                    )}
            </div>
        </article>
    );
}

function AppointmentDialog({
    appointment,
    initialServiceId,
    branches,
    services,
    timeSlots,
    open,
    onOpenChange,
}: {
    appointment: Appointment | null;
    initialServiceId: number | null;
    branches: Props['branches'];
    services: Props['services'];
    timeSlots: Props['timeSlots'];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [type, setType] = useState<AppointmentType>(
        appointment?.appointment_type ??
            (initialServiceId ? 'service' : 'consultation'),
    );
    const form = appointment ? update.form(appointment) : store.form();
    const selectedServices =
        appointment?.services
            .map((service) => service.service_ID)
            .filter((id): id is number => id !== null) ??
        (initialServiceId ? [initialServiceId] : []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {appointment
                            ? 'Reschedule Appointment'
                            : 'Set Appointment'}
                    </DialogTitle>
                    <DialogDescription>
                        Your request remains pending until clinic staff approve
                        it. Available schedules are Monday through Saturday.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...form}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <p className="text-sm text-foreground">
                                All fields with{' '}
                                <span
                                    className="text-primary"
                                    aria-hidden="true"
                                >
                                    *
                                </span>{' '}
                                are required.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Clinic branch"
                                    error={errors.branch_ID}
                                    required
                                >
                                    <Select
                                        name="branch_ID"
                                        defaultValue={String(
                                            appointment?.branch_ID ??
                                                branches[0]?.branch_ID ??
                                                '',
                                        )}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((branch) => (
                                                <SelectItem
                                                    key={branch.branch_ID}
                                                    value={String(
                                                        branch.branch_ID,
                                                    )}
                                                >
                                                    {branch.branch_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field
                                    label="Appointment type"
                                    error={errors.appointment_type}
                                    required
                                >
                                    <Select
                                        name="appointment_type"
                                        value={type}
                                        onValueChange={(value) =>
                                            setType(value as AppointmentType)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="consultation">
                                                Consultation
                                            </SelectItem>
                                            <SelectItem value="service">
                                                Service
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Date"
                                    error={errors.scheduled_date}
                                    required
                                >
                                    <Input
                                        name="scheduled_date"
                                        type="date"
                                        min={new Date().toLocaleDateString(
                                            'en-CA',
                                        )}
                                        defaultValue={
                                            appointment
                                                ? formatDateInput(
                                                      appointment.scheduled_at,
                                                  )
                                                : ''
                                        }
                                        required
                                    />
                                </Field>
                                <Field
                                    label="Time slot"
                                    error={errors.scheduled_time}
                                    required
                                >
                                    <Select
                                        name="scheduled_time"
                                        defaultValue={
                                            appointment
                                                ? formatTimeInput(
                                                      appointment.scheduled_at,
                                                  )
                                                : ''
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeSlots.map((slot) => (
                                                <SelectItem
                                                    key={slot.value}
                                                    value={slot.value}
                                                >
                                                    {slot.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                            {type === 'consultation' ? (
                                <Field
                                    label="Concern"
                                    error={errors.concern}
                                    required
                                >
                                    <textarea
                                        name="concern"
                                        defaultValue={
                                            appointment?.concern ?? ''
                                        }
                                        rows={4}
                                        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                                        placeholder="Describe what you would like the doctor to check"
                                        required
                                    />
                                </Field>
                            ) : (
                                <Field
                                    label="Services"
                                    error={errors.service_ids}
                                    required
                                >
                                    <div className="grid max-h-52 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                                        {services.map((service) => (
                                            <label
                                                key={service.service_ID}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <Checkbox
                                                    name="service_ids[]"
                                                    value={String(
                                                        service.service_ID,
                                                    )}
                                                    defaultChecked={selectedServices.includes(
                                                        service.service_ID,
                                                    )}
                                                />
                                                {service.name}
                                            </label>
                                        ))}
                                    </div>
                                </Field>
                            )}
                            {appointment && (
                                <Field
                                    label="Reason for rescheduling"
                                    error={errors.reschedule_reason}
                                >
                                    <textarea
                                        name="reschedule_reason"
                                        rows={3}
                                        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                                    />
                                </Field>
                            )}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Close
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {appointment
                                        ? 'Save New Schedule'
                                        : 'Submit Request'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function CancelDialog({
    appointment,
    open,
    onOpenChange,
}: {
    appointment: Appointment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel appointment?</DialogTitle>
                    <DialogDescription>
                        Tell the clinic why you need to cancel this schedule.
                    </DialogDescription>
                </DialogHeader>
                {appointment && (
                    <Form
                        {...cancel.form(appointment)}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        className="grid gap-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <p className="text-sm text-foreground">
                                    All fields with{' '}
                                    <span
                                        className="text-primary"
                                        aria-hidden="true"
                                    >
                                        *
                                    </span>{' '}
                                    are required.
                                </p>
                                <Field
                                    label="Cancellation reason"
                                    error={errors.reason}
                                    required
                                >
                                    <textarea
                                        name="reason"
                                        rows={4}
                                        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                                        required
                                    />
                                </Field>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Keep Appointment
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        Cancel Appointment
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
function DeleteDialog({
    appointment,
    open,
    onOpenChange,
}: {
    appointment: Appointment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete this appointment?</DialogTitle>
                    <DialogDescription>
                        This removes the appointment from your history and
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                {appointment && (
                    <Form
                        {...destroy.form(appointment)}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ processing }) => (
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Keep
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AppointmentPagination({
    appointments,
    filters,
}: {
    appointments: AppointmentPaginator;
    filters: Props['filters'];
}) {
    if (appointments.last_page <= 1) {
        return null;
    }

    const href = (page: number) => index({ query: { ...filters, page } });

    return (
        <div className="flex items-center justify-between border-t p-4 text-sm">
            <span className="text-muted-foreground">
                {appointments.from ?? 0}–{appointments.to ?? 0} of{' '}
                {appointments.total}
            </span>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={appointments.current_page <= 1}
                    asChild={appointments.current_page > 1}
                >
                    {appointments.current_page > 1 ? (
                        <Link href={href(appointments.current_page - 1)}>
                            Previous
                        </Link>
                    ) : (
                        'Previous'
                    )}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={
                        appointments.current_page >= appointments.last_page
                    }
                    asChild={appointments.current_page < appointments.last_page}
                >
                    {appointments.current_page < appointments.last_page ? (
                        <Link href={href(appointments.current_page + 1)}>
                            Next
                        </Link>
                    ) : (
                        'Next'
                    )}
                </Button>
            </div>
        </div>
    );
}
function FilterSelect({
    label,
    value,
    onValueChange,
    options,
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: Array<[string, string]>;
}) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="w-full lg:w-44">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map(([option, text]) => (
                        <SelectItem key={option} value={option}>
                            {text}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </label>
    );
}
function Field({
    label,
    error,
    required = false,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>
                {label}
                {required && (
                    <span className="text-primary" aria-hidden="true">
                        *
                    </span>
                )}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
function appointmentLabel(appointment: Appointment): string {
    return appointment.appointment_type === 'consultation'
        ? appointment.concern || 'Consultation'
        : appointment.services
              .map((service) => service.service_name)
              .join(', ') || 'Service appointment';
}
function capitalize(value: string): string {
    return `${value[0].toUpperCase()}${value.slice(1)}`;
}
function statusVariant(
    status: AppointmentStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'cancelled') {
        return 'destructive';
    }

    if (status === 'completed') {
        return 'default';
    }

    if (status === 'pending') {
        return 'secondary';
    }

    return 'outline';
}
function formatDateInput(value: string): string {
    return new Date(value).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Manila',
    });
}
function formatTimeInput(value: string): string {
    return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Manila',
    }).format(new Date(value));
}
function formatTime(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Manila',
    }).format(new Date(value));
}
