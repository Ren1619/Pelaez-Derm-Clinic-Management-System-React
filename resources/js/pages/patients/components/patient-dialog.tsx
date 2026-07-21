import { Form } from '@inertiajs/react';
import { UserRound } from 'lucide-react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/PatientController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import type { Patient, PatientDialogMode } from '@/types';

type PatientDialogProps = {
    patient: Patient | null;
    mode: PatientDialogMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </span>
            <span className="text-sm break-words">{value}</span>
        </div>
    );
}

function PatientDetails({ patient }: { patient: Patient }) {
    return (
        <div className="grid gap-5">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div>
                    <p className="font-medium">{patient.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                        Patient #{patient.PID}
                    </p>
                </div>
                <Badge
                    variant={
                        patient.email_verified_at ? 'outline' : 'secondary'
                    }
                >
                    {patient.email_verified_at ? 'Verified' : 'Unverified'}
                </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={patient.email} />
                <Detail label="Contact number" value={patient.contact_number} />
                <Detail label="Sex" value={patient.sex} />
                <Detail label="Age" value={`${patient.age} years old`} />
                <Detail
                    label="Date of birth"
                    value={new Intl.DateTimeFormat('en-PH', {
                        dateStyle: 'long',
                        timeZone: 'UTC',
                    }).format(new Date(`${patient.date_of_birth}T00:00:00Z`))}
                />
                <Detail label="Civil status" value={patient.civil_status} />
                <div className="sm:col-span-2">
                    <Detail label="Address" value={patient.address} />
                </div>
            </div>
        </div>
    );
}

export function PatientDialog({
    patient,
    mode,
    open,
    onOpenChange,
}: PatientDialogProps) {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const title = isView
        ? 'Patient details'
        : isEdit
          ? 'Edit patient'
          : 'Add patient';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserRound className="size-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {isView
                            ? 'Review this patient’s identity and contact information.'
                            : isEdit
                              ? 'Update the patient record. Changing the email requires verification again.'
                              : 'Create a patient record and email a temporary password with a verification link.'}
                    </DialogDescription>
                </DialogHeader>

                {isView && patient ? (
                    <PatientDetails patient={patient} />
                ) : (
                    <Form
                        {...(isEdit && patient
                            ? update.form(patient)
                            : store.form())}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        resetOnSuccess={!isEdit}
                        className="grid gap-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">
                                            First name
                                        </Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            defaultValue={
                                                patient?.first_name ?? ''
                                            }
                                            required
                                            aria-invalid={Boolean(
                                                errors.first_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.first_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="middle_name">
                                            Middle name
                                        </Label>
                                        <Input
                                            id="middle_name"
                                            name="middle_name"
                                            defaultValue={
                                                patient?.middle_name ?? ''
                                            }
                                            aria-invalid={Boolean(
                                                errors.middle_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.middle_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">
                                            Last name
                                        </Label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            defaultValue={
                                                patient?.last_name ?? ''
                                            }
                                            required
                                            aria-invalid={Boolean(
                                                errors.last_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.last_name}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={patient?.email ?? ''}
                                            required
                                            aria-invalid={Boolean(errors.email)}
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_number">
                                            Contact number
                                        </Label>
                                        <Input
                                            id="contact_number"
                                            name="contact_number"
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={11}
                                            defaultValue={
                                                patient?.contact_number ?? ''
                                            }
                                            placeholder="09123456789"
                                            required
                                            aria-invalid={Boolean(
                                                errors.contact_number,
                                            )}
                                        />
                                        <InputError
                                            message={errors.contact_number}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="sex">Sex</Label>
                                        <select
                                            id="sex"
                                            name="sex"
                                            defaultValue={patient?.sex ?? ''}
                                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                            required
                                            aria-invalid={Boolean(errors.sex)}
                                        >
                                            <option value="" disabled>
                                                Select sex
                                            </option>
                                            <option value="Male">Male</option>
                                            <option value="Female">
                                                Female
                                            </option>
                                        </select>
                                        <InputError message={errors.sex} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="date_of_birth">
                                            Date of birth
                                        </Label>
                                        <Input
                                            id="date_of_birth"
                                            name="date_of_birth"
                                            type="date"
                                            defaultValue={
                                                patient?.date_of_birth ?? ''
                                            }
                                            required
                                            aria-invalid={Boolean(
                                                errors.date_of_birth,
                                            )}
                                        />
                                        <InputError
                                            message={errors.date_of_birth}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="civil_status">
                                            Civil status
                                        </Label>
                                        <select
                                            id="civil_status"
                                            name="civil_status"
                                            defaultValue={
                                                patient?.civil_status ?? ''
                                            }
                                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                            required
                                            aria-invalid={Boolean(
                                                errors.civil_status,
                                            )}
                                        >
                                            <option value="" disabled>
                                                Select civil status
                                            </option>
                                            <option value="Single">
                                                Single
                                            </option>
                                            <option value="Married">
                                                Married
                                            </option>
                                            <option value="Divorced">
                                                Divorced
                                            </option>
                                            <option value="Widowed">
                                                Widowed
                                            </option>
                                        </select>
                                        <InputError
                                            message={errors.civil_status}
                                        />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="address">Address</Label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            defaultValue={
                                                patient?.address ?? ''
                                            }
                                            rows={3}
                                            maxLength={500}
                                            required
                                            aria-invalid={Boolean(
                                                errors.address,
                                            )}
                                            className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                        />
                                        <InputError message={errors.address} />
                                    </div>
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
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Saving...'
                                            : isEdit
                                              ? 'Update patient'
                                              : 'Add patient'}
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
