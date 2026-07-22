import { Form } from '@inertiajs/react';
import { CalendarIcon, UserRound } from 'lucide-react';
import { useState } from 'react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/PatientController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { Patient, PatientDialogMode } from '@/types';

type PatientDialogProps = {
    patient: Patient | null;
    mode: PatientDialogMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

/** Parses a stored ISO date without applying a timezone offset. */
function parseIsoDate(date: string): Date | undefined {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!match) {
        return undefined;
    }

    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Formats a selected date for the visible patient form field. */
function formatDateForDisplay(date: Date | undefined): string {
    if (!date) {
        return '';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

/** Converts a selected date to the ISO format expected by Laravel. */
function formatDateForSubmission(date: Date | undefined): string {
    if (!date) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/** Displays the Shadcn date picker used for the patient's date of birth. */
function DateOfBirthInput({
    defaultValue,
    invalid,
}: {
    defaultValue: string;
    invalid: boolean;
}) {
    const initialDate = parseIsoDate(defaultValue);
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(initialDate);
    const [month, setMonth] = useState<Date | undefined>(initialDate);
    const today = new Date();
    const latestDateOfBirth = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1,
    );

    return (
        <>
            <input
                type="hidden"
                name="date_of_birth"
                value={formatDateForSubmission(date)}
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date_of_birth"
                        type="button"
                        variant="outline"
                        aria-required="true"
                        aria-invalid={invalid}
                        aria-label="Select date of birth"
                        className="w-full justify-between font-normal aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                    >
                        <span className={date ? '' : 'text-muted-foreground'}>
                            {date
                                ? formatDateForDisplay(date)
                                : 'July 10, 2026'}
                        </span>
                        <CalendarIcon className="size-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0"
                    align="end"
                >
                    <Calendar
                        mode="single"
                        selected={date}
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={(selectedDate) => {
                            setDate(selectedDate);
                            setMonth(selectedDate);
                            setOpen(false);
                        }}
                        captionLayout="dropdown"
                        startMonth={new Date(1900, 0)}
                        endMonth={latestDateOfBirth}
                        disabled={{ after: latestDateOfBirth }}
                        autoFocus
                    />
                </PopoverContent>
            </Popover>
        </>
    );
}

/** Displays a label and value in the patient details view. */
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

/** Displays the patient's saved profile information. */
function PatientDetails({ patient }: { patient: Patient }) {
    return (
        <div className="grid gap-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
                <div className="min-w-0">
                    <p className="truncate font-medium">{patient.full_name}</p>
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

/** Renders a consistent form label and optional required marker. */
function FieldLabel({
    htmlFor,
    children,
    required = false,
}: {
    htmlFor: string;
    children: React.ReactNode;
    required?: boolean;
}) {
    return (
        <Label htmlFor={htmlFor}>
            {children}
            {required && (
                <span className="text-primary" aria-hidden="true">
                    {' '}
                    *
                </span>
            )}
        </Label>
    );
}

/** Displays the responsive add, edit, or view patient dialog. */
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
            <DialogContent className="max-h-[calc(100dvh-1rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-xl">
                <DialogHeader className="border-b px-5 py-5 pr-12 text-left sm:px-6">
                    <DialogTitle className="flex items-center gap-2">
                        <UserRound className="size-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {isView ? (
                            "Review this patient's identity and contact information."
                        ) : isEdit ? (
                            'Update the patient record. Changing the email requires verification again.'
                        ) : (
                            <>
                                All fields with{' '}
                                <span
                                    className="text-primary"
                                    aria-hidden="true"
                                >
                                    *
                                </span>{' '}
                                are required. An account setup link will be
                                emailed to the patient.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {isView && patient ? (
                    <div className="overflow-y-auto px-5 py-5 sm:px-6">
                        <PatientDetails patient={patient} />
                    </div>
                ) : (
                    <Form
                        {...(isEdit && patient
                            ? update.form(patient)
                            : store.form())}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        resetOnSuccess={!isEdit}
                        className="flex min-h-0 flex-col"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid min-h-0 gap-4 overflow-y-auto px-5 py-5 sm:px-6">
                                    <div className="grid gap-2">
                                        <FieldLabel
                                            htmlFor="first_name"
                                            required
                                        >
                                            First name
                                        </FieldLabel>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            defaultValue={
                                                patient?.first_name ?? ''
                                            }
                                            placeholder="Enter first name"
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
                                        <FieldLabel htmlFor="middle_name">
                                            Middle name
                                        </FieldLabel>
                                        <Input
                                            id="middle_name"
                                            name="middle_name"
                                            defaultValue={
                                                patient?.middle_name ?? ''
                                            }
                                            placeholder="Enter middle name (optional)"
                                            aria-invalid={Boolean(
                                                errors.middle_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.middle_name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <FieldLabel
                                            htmlFor="last_name"
                                            required
                                        >
                                            Last name
                                        </FieldLabel>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            defaultValue={
                                                patient?.last_name ?? ''
                                            }
                                            placeholder="Enter last name"
                                            required
                                            aria-invalid={Boolean(
                                                errors.last_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.last_name}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <FieldLabel
                                                htmlFor="email"
                                                required
                                            >
                                                Email
                                            </FieldLabel>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                defaultValue={
                                                    patient?.email ?? ''
                                                }
                                                placeholder="Enter email address"
                                                required
                                                aria-invalid={Boolean(
                                                    errors.email,
                                                )}
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <FieldLabel
                                                htmlFor="contact_number"
                                                required
                                            >
                                                Contact number
                                            </FieldLabel>
                                            <Input
                                                id="contact_number"
                                                name="contact_number"
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={11}
                                                defaultValue={
                                                    patient?.contact_number ??
                                                    ''
                                                }
                                                placeholder="Enter contact number"
                                                required
                                                aria-invalid={Boolean(
                                                    errors.contact_number,
                                                )}
                                            />
                                            <InputError
                                                message={errors.contact_number}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <FieldLabel htmlFor="sex" required>
                                                Sex
                                            </FieldLabel>
                                            <select
                                                id="sex"
                                                name="sex"
                                                defaultValue={
                                                    patient?.sex ?? ''
                                                }
                                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                                required
                                                aria-invalid={Boolean(
                                                    errors.sex,
                                                )}
                                            >
                                                <option value="" disabled>
                                                    Select sex
                                                </option>
                                                <option value="Male">
                                                    Male
                                                </option>
                                                <option value="Female">
                                                    Female
                                                </option>
                                            </select>
                                            <InputError message={errors.sex} />
                                        </div>
                                        <div className="grid gap-2">
                                            <FieldLabel
                                                htmlFor="date_of_birth"
                                                required
                                            >
                                                Date of birth
                                            </FieldLabel>
                                            <DateOfBirthInput
                                                key={`${open}-${patient?.date_of_birth ?? 'new'}`}
                                                defaultValue={
                                                    patient?.date_of_birth ?? ''
                                                }
                                                invalid={Boolean(
                                                    errors.date_of_birth,
                                                )}
                                            />
                                            <InputError
                                                message={errors.date_of_birth}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <FieldLabel
                                            htmlFor="civil_status"
                                            required
                                        >
                                            Civil status
                                        </FieldLabel>
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
                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="address" required>
                                            Address
                                        </FieldLabel>
                                        <textarea
                                            id="address"
                                            name="address"
                                            defaultValue={
                                                patient?.address ?? ''
                                            }
                                            rows={3}
                                            maxLength={500}
                                            placeholder="Enter complete address"
                                            required
                                            aria-invalid={Boolean(
                                                errors.address,
                                            )}
                                            className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                        />
                                        <InputError message={errors.address} />
                                    </div>
                                </div>

                                <DialogFooter className="grid grid-cols-1 gap-3 border-t bg-background px-5 py-4 min-[400px]:grid-cols-2 sm:px-6">
                                    <Button
                                        type="button"
                                        onClick={() => onOpenChange(false)}
                                        disabled={processing}
                                        className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-pink-600 text-white hover:bg-pink-700"
                                    >
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
