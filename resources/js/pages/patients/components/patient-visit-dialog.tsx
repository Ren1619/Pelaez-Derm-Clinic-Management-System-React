import { Form } from '@inertiajs/react';
import { useState } from 'react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/PatientVisitController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import type { Patient, PatientClinicalOptions, PatientVisit } from '@/types';

type PatientVisitDialogProps = {
    patient: Patient;
    visit: PatientVisit | null;
    options: PatientClinicalOptions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function PatientVisitDialog({
    patient,
    visit,
    options,
    open,
    onOpenChange,
}: PatientVisitDialogProps) {
    const isEdit = visit !== null;
    const [branchId, setBranchId] = useState(
        String(visit?.branch.branch_ID ?? options.branches[0]?.id ?? ''),
    );
    const [doctorId, setDoctorId] = useState(
        String(visit?.doctor.account_ID ?? ''),
    );
    const availableDoctors = options.doctors.filter(
        (doctor) =>
            doctor.branch_ID === null || String(doctor.branch_ID) === branchId,
    );

    const changeBranch = (value: string) => {
        setBranchId(value);
        const selectedDoctor = options.doctors.find(
            (doctor) => String(doctor.id) === doctorId,
        );

        if (
            selectedDoctor?.branch_ID &&
            String(selectedDoctor.branch_ID) !== value
        ) {
            setDoctorId('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        <span className="text-primary">
                            {isEdit ? 'Edit' : 'Add'}
                        </span>{' '}
                        Visit
                    </DialogTitle>
                    <DialogDescription>
                        Record the clinic, doctor, visit date, status, and vital
                        signs.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(visit
                        ? update.form({ patient, visit })
                        : store.form(patient))}
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
                                    label="Clinic branch"
                                    error={errors.branch_ID}
                                    required
                                >
                                    <select
                                        name="branch_ID"
                                        value={branchId}
                                        onChange={(event) =>
                                            changeBranch(event.target.value)
                                        }
                                        className={selectClassName}
                                        required
                                    >
                                        <option value="" disabled>
                                            Select branch
                                        </option>
                                        {options.branches.map((branch) => (
                                            <option
                                                key={branch.id}
                                                value={branch.id}
                                            >
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="Doctor"
                                    error={errors.doctor_account_ID}
                                >
                                    <select
                                        name="doctor_account_ID"
                                        value={doctorId}
                                        onChange={(event) =>
                                            setDoctorId(event.target.value)
                                        }
                                        className={selectClassName}
                                    >
                                        <option value="">
                                            Doctor not recorded
                                        </option>
                                        {availableDoctors.map((doctor) => (
                                            <option
                                                key={doctor.id}
                                                value={doctor.id}
                                            >
                                                {doctor.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="Visit date and time"
                                    error={errors.visited_at}
                                    required
                                >
                                    <Input
                                        type="datetime-local"
                                        name="visited_at"
                                        defaultValue={toDateTimeLocal(
                                            visit?.visited_at,
                                        )}
                                        required
                                    />
                                </Field>
                                <Field
                                    label="Status"
                                    error={errors.status}
                                    required
                                >
                                    <select
                                        name="status"
                                        defaultValue={
                                            visit?.status ?? 'in_progress'
                                        }
                                        className={selectClassName}
                                        required
                                    >
                                        <option value="in_progress">
                                            In progress
                                        </option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field
                                    label="Blood pressure"
                                    error={errors.blood_pressure}
                                >
                                    <Input
                                        name="blood_pressure"
                                        defaultValue={
                                            visit?.blood_pressure ?? ''
                                        }
                                        placeholder="120/80"
                                    />
                                </Field>
                                <Field
                                    label="Weight (kg)"
                                    error={errors.weight}
                                >
                                    <Input
                                        type="number"
                                        name="weight"
                                        min="0.01"
                                        max="999.99"
                                        step="0.01"
                                        defaultValue={visit?.weight ?? ''}
                                    />
                                </Field>
                                <Field
                                    label="Height (cm)"
                                    error={errors.height}
                                >
                                    <Input
                                        type="number"
                                        name="height"
                                        min="0.01"
                                        max="999.99"
                                        step="0.01"
                                        defaultValue={visit?.height ?? ''}
                                    />
                                </Field>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-primary hover:bg-primary/90"
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Saving...'
                                        : isEdit
                                          ? 'Update'
                                          : 'Add'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const selectClassName =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

function toDateTimeLocal(value?: string): string {
    const date = value ? new Date(value) : new Date();
    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000,
    );

    return localDate.toISOString().slice(0, 16);
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
