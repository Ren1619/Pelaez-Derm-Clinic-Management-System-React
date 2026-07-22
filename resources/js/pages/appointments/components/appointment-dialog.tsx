import { Form, router } from '@inertiajs/react';
import {
    CalendarClock,
    Check,
    ChevronsUpDown,
    ExternalLink,
    Pencil,
    Play,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useAppointmentAvailability } from '@/hooks/use-appointment-availability';
import {
    availability,
    cancel,
    startVisit,
    status,
    store,
    update,
} from '@/routes/appointments';
import { show as patientShow } from '@/routes/patients';
import type {
    Appointment,
    AppointmentOptions,
    AppointmentTimeSlot,
    AppointmentType,
} from '@/types';

type AppointmentDialogProps = AppointmentOptions & {
    appointment: Appointment | null;
    mode: 'create' | 'edit' | 'view';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (appointment: Appointment) => void;
};

const localDate = (iso?: string) => {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const localTime = (iso?: string) => {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const textareaClassName =
    'min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export function AppointmentDialog({
    appointment,
    mode,
    open,
    onOpenChange,
    onEdit,
    branches,
    patients,
    services,
    timeSlots,
}: AppointmentDialogProps) {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const [type, setType] = useState<AppointmentType>(
        appointment?.appointment_type ?? 'consultation',
    );
    const [branchId, setBranchId] = useState(
        String(appointment?.branch_ID ?? branches[0]?.branch_ID ?? ''),
    );
    const [doctorId, setDoctorId] = useState(
        String(appointment?.doctor_account_ID ?? ''),
    );
    const [scheduledDate, setScheduledDate] = useState(
        localDate(appointment?.scheduled_at),
    );
    const [scheduledTime, setScheduledTime] = useState(
        localTime(appointment?.scheduled_at),
    );
    const availabilityUrl =
        branchId && scheduledDate
            ? availability.url({
                  query: {
                      branch_ID: Number(branchId),
                      date: scheduledDate,
                      exclude_appointment_ID: appointment?.appointment_ID,
                  },
              })
            : null;
    const { slots: availableTimeSlots, isLoading: isLoadingAvailability } =
        useAppointmentAvailability(availabilityUrl, timeSlots);
    const servicesByCategory = Object.groupBy(
        services,
        (service) => service.category_name,
    );

    const selectedTime = availableTimeSlots.some(
        (slot) => slot.value === scheduledTime && slot.is_available === false,
    )
        ? ''
        : scheduledTime;

    const runAction = (action: 'approve' | 'complete' | 'incomplete') => {
        if (!appointment) {
            return;
        }

        router.patch(
            status.url(appointment),
            { action },
            { preserveScroll: true, onSuccess: () => onOpenChange(false) },
        );
    };

    const beginVisit = () => {
        if (!appointment) {
            return;
        }

        router.post(startVisit.url(appointment));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
                onOpenAutoFocus={(event) => {
                    if (mode === 'create') {
                        event.preventDefault();
                    }
                }}
            >
                <DialogHeader className="gap-1.5">
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarClock className="size-5" />
                        {isView
                            ? 'Appointment details'
                            : isEdit
                              ? 'Reschedule appointment'
                              : 'Add appointment'}
                    </DialogTitle>
                    <DialogDescription>
                        {isView
                            ? 'Review the booking and continue into the linked patient visit.'
                            : 'Appointments are available Monday–Saturday, with two patients per clinic time slot.'}
                    </DialogDescription>
                </DialogHeader>

                {isView && appointment ? (
                    <div className="grid gap-4">
                        <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                            <Detail
                                label="Patient"
                                value={appointment.patient_name}
                            />
                            <Detail
                                label="Contact"
                                value={
                                    appointment.patient_contact ??
                                    'Not provided'
                                }
                            />
                            <Detail
                                label="Clinic"
                                value={appointment.branch_name}
                            />
                            <Detail
                                label="Doctor"
                                value={
                                    appointment.doctor_name ?? 'Not assigned'
                                }
                            />
                            <Detail
                                label="Schedule"
                                value={new Date(
                                    appointment.scheduled_at,
                                ).toLocaleString([], {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })}
                            />
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Status
                                </p>
                                <Badge
                                    variant="outline"
                                    className="mt-1 capitalize"
                                >
                                    {appointment.status.replaceAll('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">
                                {appointment.appointment_type === 'consultation'
                                    ? 'Concern'
                                    : 'Scheduled services'}
                            </p>
                            <p className="mt-1 text-sm">
                                {appointment.appointment_type === 'consultation'
                                    ? appointment.concern
                                    : appointment.services
                                          .map(
                                              (service) => service.service_name,
                                          )
                                          .join(', ')}
                            </p>
                            {appointment.remarks && (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {appointment.remarks}
                                </p>
                            )}
                            {appointment.reschedule_reason && (
                                <p className="mt-3 text-sm">
                                    Reschedule reason:{' '}
                                    {appointment.reschedule_reason}
                                </p>
                            )}
                            {appointment.cancellation_reason && (
                                <p className="mt-3 text-sm">
                                    Cancellation:{' '}
                                    {appointment.cancellation_reason}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="border-t pt-4 sm:justify-between">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                    router.visit(
                                        patientShow.url(appointment.PID),
                                    )
                                }
                            >
                                Patient record <ExternalLink />
                            </Button>
                            <div className="grid gap-2 sm:flex sm:flex-wrap">
                                {appointment.can_edit && (
                                    <Button
                                        variant="outline"
                                        onClick={() => onEdit(appointment)}
                                    >
                                        <Pencil /> Reschedule
                                    </Button>
                                )}
                                {appointment.can_approve && (
                                    <Button
                                        variant="outline"
                                        onClick={() => runAction('approve')}
                                    >
                                        <Check /> Approve
                                    </Button>
                                )}
                                {appointment.can_start && (
                                    <Button onClick={beginVisit}>
                                        <Play /> Start visit
                                    </Button>
                                )}
                                {appointment.visit_ID &&
                                    !appointment.can_complete && (
                                        <Button
                                            onClick={() =>
                                                router.visit(
                                                    patientShow.url(
                                                        appointment.PID,
                                                    ),
                                                )
                                            }
                                        >
                                            Continue visit
                                        </Button>
                                    )}
                                {appointment.can_complete && (
                                    <Button
                                        onClick={() => runAction('complete')}
                                    >
                                        <Check /> Complete
                                    </Button>
                                )}
                                {appointment.can_cancel && (
                                    <CancelButton
                                        appointment={appointment}
                                        onSuccess={() => onOpenChange(false)}
                                    />
                                )}
                            </div>
                        </DialogFooter>
                    </div>
                ) : (
                    <Form
                        {...(isEdit && appointment
                            ? update.form.patch(appointment)
                            : store.form())}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        resetOnSuccess={!isEdit}
                        className="grid gap-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="doctor_account_ID"
                                    value={doctorId}
                                />
                                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                                    {isEdit && appointment ? (
                                        <>
                                            <div className="sm:col-span-2">
                                                <Detail
                                                    label="Patient"
                                                    value={
                                                        appointment.patient_name
                                                    }
                                                />
                                            </div>
                                            <Detail
                                                label="Clinic"
                                                value={appointment.branch_name}
                                            />
                                            <Detail
                                                label="Appointment type"
                                                value={
                                                    appointment.appointment_type ===
                                                    'consultation'
                                                        ? 'Consultation'
                                                        : 'Service'
                                                }
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Field
                                                label="Patient"
                                                error={errors.PID}
                                                className="sm:col-span-2"
                                            >
                                                <PatientCombobox
                                                    patients={patients}
                                                />
                                            </Field>
                                            <Field
                                                label="Clinic"
                                                error={errors.branch_ID}
                                            >
                                                <Select
                                                    name="branch_ID"
                                                    value={branchId}
                                                    onValueChange={(value) => {
                                                        setBranchId(value);
                                                        setDoctorId('');
                                                        setScheduledTime('');
                                                    }}
                                                    required
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select clinic" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches.map(
                                                            (branch) => (
                                                                <SelectItem
                                                                    key={
                                                                        branch.branch_ID
                                                                    }
                                                                    value={String(
                                                                        branch.branch_ID,
                                                                    )}
                                                                >
                                                                    {
                                                                        branch.branch_name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                            <Field
                                                label="Appointment type"
                                                error={errors.appointment_type}
                                            >
                                                <Select
                                                    name="appointment_type"
                                                    value={type}
                                                    onValueChange={(value) =>
                                                        setType(
                                                            value as AppointmentType,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
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
                                        </>
                                    )}
                                    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                                        <Field
                                            label="Date"
                                            error={errors.scheduled_date}
                                        >
                                            <Input
                                                name="scheduled_date"
                                                type="date"
                                                min={new Date()
                                                    .toISOString()
                                                    .slice(0, 10)}
                                                value={scheduledDate}
                                                onChange={(event) => {
                                                    setScheduledDate(
                                                        event.target.value,
                                                    );
                                                    setScheduledTime('');
                                                }}
                                                className="w-full sm:w-48"
                                                required
                                            />
                                        </Field>
                                        <Field
                                            label="Time"
                                            error={errors.scheduled_time}
                                        >
                                            <Select
                                                name="scheduled_time"
                                                value={selectedTime}
                                                onValueChange={setScheduledTime}
                                                disabled={
                                                    !branchId ||
                                                    !scheduledDate ||
                                                    isLoadingAvailability
                                                }
                                                required
                                            >
                                                <SelectTrigger className="w-full sm:w-48">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableTimeSlots.map(
                                                        (slot) => (
                                                            <SelectItem
                                                                key={slot.value}
                                                                value={
                                                                    slot.value
                                                                }
                                                                disabled={
                                                                    slot.is_available ===
                                                                    false
                                                                }
                                                            >
                                                                {formatSlotLabel(
                                                                    slot,
                                                                )}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                </div>

                                {!isEdit &&
                                    (type === 'consultation' ? (
                                        <Field
                                            label="Concern"
                                            error={errors.concern}
                                        >
                                            <textarea
                                                name="concern"
                                                defaultValue={
                                                    appointment?.concern ?? ''
                                                }
                                                rows={4}
                                                maxLength={1000}
                                                required
                                                className={textareaClassName}
                                            />
                                        </Field>
                                    ) : (
                                        <Field
                                            label="Services"
                                            error={errors.service_ids}
                                        >
                                            <div className="grid max-h-64 min-h-24 gap-4 overflow-y-auto rounded-md border p-3">
                                                {Object.entries(
                                                    servicesByCategory,
                                                ).map(
                                                    ([
                                                        categoryName,
                                                        categoryServices,
                                                    ]) => (
                                                        <fieldset
                                                            key={categoryName}
                                                            className="grid gap-2"
                                                        >
                                                            <legend className="text-sm font-semibold">
                                                                {categoryName}
                                                            </legend>
                                                            <div className="grid gap-2 sm:grid-cols-2">
                                                                {categoryServices?.map(
                                                                    (
                                                                        service,
                                                                    ) => (
                                                                        <label
                                                                            key={
                                                                                service.service_ID
                                                                            }
                                                                            className="flex items-center gap-2 text-sm"
                                                                        >
                                                                            <Checkbox
                                                                                name="service_ids[]"
                                                                                value={String(
                                                                                    service.service_ID,
                                                                                )}
                                                                                defaultChecked={appointment?.services.some(
                                                                                    (
                                                                                        item,
                                                                                    ) =>
                                                                                        item.service_ID ===
                                                                                        service.service_ID,
                                                                                )}
                                                                            />
                                                                            {
                                                                                service.name
                                                                            }
                                                                        </label>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </fieldset>
                                                    ),
                                                )}
                                            </div>
                                        </Field>
                                    ))}

                                <Field
                                    label={
                                        isEdit
                                            ? 'Reason for rescheduling'
                                            : 'Remarks'
                                    }
                                    error={
                                        isEdit
                                            ? errors.reschedule_reason
                                            : errors.remarks
                                    }
                                >
                                    <textarea
                                        name={
                                            isEdit
                                                ? 'reschedule_reason'
                                                : 'remarks'
                                        }
                                        defaultValue={
                                            isEdit
                                                ? ''
                                                : (appointment?.remarks ?? '')
                                        }
                                        rows={2}
                                        maxLength={1000}
                                        required={isEdit}
                                        className={textareaClassName}
                                    />
                                </Field>

                                <DialogFooter className="border-t pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Saving…'
                                            : isEdit
                                              ? 'Reschedule'
                                              : 'Schedule appointment'}
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

function formatSlotLabel(slot: AppointmentTimeSlot): string {
    if (slot.is_available === false) {
        return `${slot.label} — Fully booked`;
    }

    if (slot.remaining_capacity !== undefined) {
        const noun = slot.remaining_capacity === 1 ? 'slot' : 'slots';

        return `${slot.label} — ${slot.remaining_capacity} ${noun} left`;
    }

    return slot.label;
}

function Field({
    label,
    error,
    className,
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={`grid content-start gap-2 ${className ?? ''}`}>
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function PatientCombobox({
    patients,
    defaultValue,
    defaultLabel,
}: {
    patients: AppointmentOptions['patients'];
    defaultValue?: number;
    defaultLabel?: string;
}) {
    const initialPatient = patients.find(
        (patient) => patient.PID === defaultValue,
    );
    const [selectedId, setSelectedId] = useState(
        defaultValue ? String(defaultValue) : '',
    );
    const [query, setQuery] = useState(
        initialPatient?.full_name ?? defaultLabel ?? '',
    );
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredPatients = patients
        .filter((patient) => {
            if (!normalizedQuery) {
                return true;
            }

            return (
                patient.full_name
                    .toLocaleLowerCase()
                    .includes(normalizedQuery) ||
                patient.contact_number
                    ?.toLocaleLowerCase()
                    .includes(normalizedQuery)
            );
        })
        .slice(0, 10);

    const selectPatient = (patient: AppointmentOptions['patients'][number]) => {
        setSelectedId(String(patient.PID));
        setQuery(patient.full_name);
        setOpen(false);
        setHighlightedIndex(0);
    };

    return (
        <div className="relative">
            <input type="hidden" name="PID" value={selectedId} />
            <Input
                role="combobox"
                aria-label="Patient"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls="patient-combobox-options"
                aria-activedescendant={
                    open && filteredPatients[highlightedIndex]
                        ? `patient-option-${filteredPatients[highlightedIndex].PID}`
                        : undefined
                }
                autoComplete="off"
                value={query}
                placeholder="Search patient name or contact number"
                className="pr-10"
                onFocus={(event) => {
                    setOpen(true);
                    event.currentTarget.select();
                }}
                onBlur={() => setOpen(false)}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedId('');
                    setHighlightedIndex(0);
                    setOpen(true);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setOpen(true);
                        setHighlightedIndex((current) => {
                            if (!open) {
                                return 0;
                            }

                            return Math.min(
                                current + 1,
                                Math.max(filteredPatients.length - 1, 0),
                            );
                        });
                    }

                    if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setHighlightedIndex((current) =>
                            Math.max(current - 1, 0),
                        );
                    }

                    if (
                        event.key === 'Enter' &&
                        open &&
                        filteredPatients[highlightedIndex]
                    ) {
                        event.preventDefault();
                        selectPatient(filteredPatients[highlightedIndex]);
                    }

                    if (event.key === 'Escape') {
                        setOpen(false);
                    }
                }}
            />
            <ChevronsUpDown className="pointer-events-none absolute top-2.5 right-3 size-4 text-muted-foreground" />

            {open && (
                <div
                    id="patient-combobox-options"
                    role="listbox"
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                >
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient, index) => (
                            <button
                                id={`patient-option-${patient.PID}`}
                                key={patient.PID}
                                type="button"
                                role="option"
                                aria-selected={
                                    selectedId === String(patient.PID)
                                }
                                className={`flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none ${index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''}`}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onClick={() => selectPatient(patient)}
                            >
                                <Check
                                    className={`size-4 shrink-0 ${selectedId === String(patient.PID) ? 'opacity-100' : 'opacity-0'}`}
                                />
                                <span className="min-w-0">
                                    <span className="block truncate font-medium">
                                        {patient.full_name}
                                    </span>
                                    {patient.contact_number && (
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {patient.contact_number}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))
                    ) : (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No patients found.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    );
}

function CancelButton({
    appointment,
    onSuccess,
}: {
    appointment: Appointment;
    onSuccess: () => void;
}) {
    const [confirming, setConfirming] = useState(false);

    if (!confirming) {
        return (
            <Button variant="outline" onClick={() => setConfirming(true)}>
                <X /> Cancel appointment
            </Button>
        );
    }

    return (
        <Form
            {...cancel.form(appointment)}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            className="grid w-full gap-2 sm:flex sm:w-auto"
        >
            <p className="text-sm text-foreground">
                All fields with{' '}
                <span className="text-primary" aria-hidden="true">
                    *
                </span>{' '}
                are required.
            </p>
            <Label htmlFor="cancellation_reason">
                Cancellation reason
                <span className="text-primary" aria-hidden="true">
                    *
                </span>
            </Label>
            <Input
                id="cancellation_reason"
                name="cancellation_reason"
                placeholder="Cancellation reason"
                required
                className="w-full sm:w-56"
            />
            <div>
                <Button type="submit" variant="destructive">
                    Confirm cancel
                </Button>
            </div>
        </Form>
    );
}
