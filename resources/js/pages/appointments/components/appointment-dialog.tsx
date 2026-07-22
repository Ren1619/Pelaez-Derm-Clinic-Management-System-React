import { Form, router } from '@inertiajs/react';
import { CalendarClock, Check, ExternalLink, Play, X } from 'lucide-react';
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
import {
    cancel,
    startVisit,
    status,
    store,
    update,
} from '@/routes/appointments';
import { show as patientShow } from '@/routes/patients';
import type { Appointment, AppointmentOptions, AppointmentType } from '@/types';

type AppointmentDialogProps = AppointmentOptions & {
    appointment: Appointment | null;
    mode: 'create' | 'edit' | 'view';
    open: boolean;
    onOpenChange: (open: boolean) => void;
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
        return '09:00';
    }

    const date = new Date(iso);

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export function AppointmentDialog({
    appointment,
    mode,
    open,
    onOpenChange,
    branches,
    patients,
    doctors,
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
    const availableDoctors = doctors.filter(
        (doctor) => !doctor.branch_ID || String(doctor.branch_ID) === branchId,
    );

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

        router.post(startVisit.url(appointment), {
            doctor_account_ID: doctorId || null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
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
                    <div className="grid gap-5">
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
                                    appointment.doctor_name ??
                                    'Assign when starting'
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
                                    {appointment.status}
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
                            {appointment.cancellation_reason && (
                                <p className="mt-3 text-sm">
                                    Cancellation:{' '}
                                    {appointment.cancellation_reason}
                                </p>
                            )}
                        </div>

                        {appointment.can_start && (
                            <div className="grid gap-2 rounded-lg border p-4">
                                <Label>Doctor for this visit</Label>
                                <Select
                                    value={doctorId || 'none'}
                                    onValueChange={(value) =>
                                        setDoctorId(
                                            value === 'none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select doctor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Select doctor
                                        </SelectItem>
                                        {availableDoctors.map((doctor) => (
                                            <SelectItem
                                                key={doctor.account_ID}
                                                value={String(
                                                    doctor.account_ID,
                                                )}
                                            >
                                                {doctor.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Starting creates one clinical visit and
                                    copies all scheduled services into it.
                                </p>
                            </div>
                        )}

                        <DialogFooter className="flex-wrap sm:justify-between">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.visit(
                                        patientShow.url(appointment.PID),
                                    )
                                }
                            >
                                Patient record <ExternalLink />
                            </Button>
                            <div className="flex flex-wrap gap-2">
                                {appointment.can_approve && (
                                    <Button
                                        variant="outline"
                                        onClick={() => runAction('approve')}
                                    >
                                        <Check /> Approve
                                    </Button>
                                )}
                                {appointment.can_start && (
                                    <Button
                                        onClick={beginVisit}
                                        disabled={!doctorId}
                                    >
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
                        className="grid gap-5"
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
                                        label="Patient"
                                        error={errors.PID}
                                        required
                                    >
                                        <Select
                                            name="PID"
                                            defaultValue={String(
                                                appointment?.PID ?? '',
                                            )}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select patient" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {patients.map((patient) => (
                                                    <SelectItem
                                                        key={patient.PID}
                                                        value={String(
                                                            patient.PID,
                                                        )}
                                                    >
                                                        {patient.full_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field
                                        label="Clinic"
                                        error={errors.branch_ID}
                                        required
                                    >
                                        <Select
                                            name="branch_ID"
                                            value={branchId}
                                            onValueChange={(value) => {
                                                setBranchId(value);
                                                setDoctorId('');
                                            }}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select clinic" />
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
                                        label="Date"
                                        error={errors.scheduled_date}
                                        required
                                    >
                                        <Input
                                            name="scheduled_date"
                                            type="date"
                                            min={new Date()
                                                .toISOString()
                                                .slice(0, 10)}
                                            defaultValue={localDate(
                                                appointment?.scheduled_at,
                                            )}
                                            required
                                        />
                                    </Field>
                                    <Field
                                        label="Time"
                                        error={errors.scheduled_time}
                                        required
                                    >
                                        <Select
                                            name="scheduled_time"
                                            defaultValue={localTime(
                                                appointment?.scheduled_at,
                                            )}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
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
                                    <Field
                                        label="Doctor (optional)"
                                        error={errors.doctor_account_ID}
                                    >
                                        <input
                                            type="hidden"
                                            name="doctor_account_ID"
                                            value={doctorId}
                                        />
                                        <Select
                                            value={doctorId || 'none'}
                                            onValueChange={(value) =>
                                                setDoctorId(
                                                    value === 'none'
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Assign later" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    Assign later
                                                </SelectItem>
                                                {availableDoctors.map(
                                                    (doctor) => (
                                                        <SelectItem
                                                            key={
                                                                doctor.account_ID
                                                            }
                                                            value={String(
                                                                doctor.account_ID,
                                                            )}
                                                        >
                                                            {doctor.full_name}
                                                        </SelectItem>
                                                    ),
                                                )}
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
                                                setType(
                                                    value as AppointmentType,
                                                )
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
                                            maxLength={1000}
                                            required
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </Field>
                                ) : (
                                    <Field
                                        label="Services"
                                        error={errors.service_ids}
                                        required
                                    >
                                        <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
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
                                                        defaultChecked={appointment?.services.some(
                                                            (item) =>
                                                                item.service_ID ===
                                                                service.service_ID,
                                                        )}
                                                    />
                                                    {service.name}
                                                </label>
                                            ))}
                                        </div>
                                    </Field>
                                )}

                                <Field label="Remarks" error={errors.remarks}>
                                    <textarea
                                        name="remarks"
                                        defaultValue={
                                            appointment?.remarks ?? ''
                                        }
                                        rows={2}
                                        maxLength={1000}
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </Field>

                                <DialogFooter>
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

function Field({
    label,
    error,
    required = false,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
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
            className="grid gap-2"
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
                className="min-w-48"
            />
            <div>
                <Button type="submit" variant="destructive">
                    Confirm cancel
                </Button>
            </div>
        </Form>
    );
}
