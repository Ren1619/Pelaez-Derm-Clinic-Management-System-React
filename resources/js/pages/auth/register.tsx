import { Form, Head } from '@inertiajs/react';
import { CalendarIcon, Check, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
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
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import type { PrivacySection } from '@/types';

type Props = {
    passwordRules: string;
    privacyNotice: { title: string; sections: PrivacySection[] };
};

type FormErrors = Record<string, string | undefined>;

const inputClassName = 'h-11 rounded-md border-primary/20 bg-background/80';
const selectClassName =
    'h-11 w-full rounded-md border border-primary/20 bg-background/80 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

function formatDate(date: Date | undefined): string {
    return date
        ? new Intl.DateTimeFormat('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          }).format(date)
        : '';
}

function submitDate(date: Date | undefined): string {
    if (!date) {
        return '';
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function Field({
    id,
    label,
    error,
    optional = false,
    className = '',
    ...props
}: {
    id: string;
    label: string;
    error?: string;
    optional?: boolean;
    className?: string;
} & Omit<React.ComponentProps<typeof Input>, 'id' | 'name'>) {
    return (
        <div className={`grid gap-2 ${className}`}>
            <Label htmlFor={id}>
                {label}
                {!optional && (
                    <span className="text-destructive" aria-hidden="true">
                        {' '}
                        *
                    </span>
                )}
            </Label>
            <Input {...props} id={id} name={id} className={inputClassName} />
            <InputError message={error} />
        </div>
    );
}

function DateOfBirthInput({ invalid }: { invalid: boolean }) {
    const [date, setDate] = useState<Date>();
    const [open, setOpen] = useState(false);
    const latestDateOfBirth = new Date();

    latestDateOfBirth.setDate(latestDateOfBirth.getDate() - 1);

    return (
        <>
            <input
                type="hidden"
                name="date_of_birth"
                value={submitDate(date)}
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date_of_birth"
                        type="button"
                        variant="outline"
                        aria-invalid={invalid}
                        className="h-11 w-full justify-between border-primary/20 bg-background/80 font-normal"
                    >
                        <span className={date ? '' : 'text-muted-foreground'}>
                            {date ? formatDate(date) : 'June 26, 2026'}
                        </span>
                        <CalendarIcon className="size-4 text-primary" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                            setDate(selectedDate);
                            setOpen(false);
                        }}
                        captionLayout="dropdown"
                        startMonth={new Date(1900, 0)}
                        endMonth={latestDateOfBirth}
                        disabled={{ after: latestDateOfBirth }}
                    />
                </PopoverContent>
            </Popover>
        </>
    );
}

export default function Register({ passwordRules, privacyNotice }: Props) {
    const [step, setStep] = useState(1);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [clientErrors, setClientErrors] = useState<FormErrors>({});

    function validateStep(currentStep: number): boolean {
        const requiredFields: Record<number, string[]> = {
            1: ['first_name', 'last_name'],
            2: ['date_of_birth', 'sex', 'civil_status', 'address'],
            3: ['email', 'contact_number', 'password', 'password_confirmation'],
        };
        const form = document.getElementById('patient-registration-form');
        const values = form ? new FormData(form as HTMLFormElement) : null;
        const nextErrors = requiredFields[currentStep].reduce<FormErrors>(
            (errors, field) => {
                if (!String(values?.get(field) ?? '').trim()) {
                    errors[field] =
                        field === 'email'
                            ? 'The email field is required.'
                            : 'This field is required.';
                }

                return errors;
            },
            {},
        );

        setClientErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    function continueToNextStep(): void {
        if (validateStep(step)) {
            setClientErrors({});
            setStep(step + 1);
        }
    }

    function goToErrorStep(errors: FormErrors): void {
        setClientErrors({});
        setStep(
            ['first_name', 'middle_name', 'last_name', 'name_extension'].some(
                (key) => errors[key],
            )
                ? 1
                : ['date_of_birth', 'sex', 'civil_status', 'address'].some(
                        (key) => errors[key],
                    )
                  ? 2
                  : 3,
        );
    }

    return (
        <>
            <Head title="Sign up" />

            <Form
                {...store.form()}
                id="patient-registration-form"
                noValidate
                resetOnSuccess
                data-auth-wide
                className="grid gap-7"
                onError={goToErrorStep}
            >
                {({ processing, errors }) => {
                    const displayErrors = { ...errors, ...clientErrors };

                    return (
                        <>
                            <p className="text-sm text-foreground">
                                All fields with{' '}
                                <span
                                    className="text-destructive"
                                    aria-hidden="true"
                                >
                                    *
                                </span>{' '}
                                are required.
                            </p>
                            <div className="w-full py-1">
                                <Stepper step={step} />
                            </div>
                            <div
                                className={
                                    step === 1
                                        ? 'grid gap-5'
                                        : 'hidden'
                                }
                            >
                                <Field
                                    id="first_name"
                                    label="First name"
                                    error={displayErrors.first_name}
                                    placeholder="e.g. Juan"
                                    autoFocus
                                />
                                <Field
                                    id="middle_name"
                                    label="Middle name"
                                    error={displayErrors.middle_name}
                                    optional
                                    placeholder="e.g. Santos"
                                />
                                <Field
                                    id="last_name"
                                    label="Last name"
                                    error={displayErrors.last_name}
                                    placeholder="e.g. Dela Cruz"
                                />
                                <Field
                                    id="name_extension"
                                    label="Name extension"
                                    error={displayErrors.name_extension}
                                    optional
                                    placeholder="e.g. Jr."
                                />
                            </div>
                            <div
                                className={
                                    step === 2
                                        ? 'grid gap-5'
                                        : 'hidden'
                                }
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="date_of_birth">
                                        Date of birth{' '}
                                        <span
                                            className="text-destructive"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <DateOfBirthInput
                                        invalid={Boolean(
                                            displayErrors.date_of_birth,
                                        )}
                                    />
                                    <InputError
                                        message={displayErrors.date_of_birth}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="sex">
                                        Sex{' '}
                                        <span
                                            className="text-destructive"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="sex"
                                        name="sex"
                                        defaultValue=""
                                        className={selectClassName}
                                    >
                                        <option value="" disabled>
                                            Select sex
                                        </option>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                    </select>
                                    <div className="min-h-4"><InputError message={displayErrors.sex} /></div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="civil_status">
                                        Civil status{' '}
                                        <span
                                            className="text-destructive"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="civil_status"
                                        name="civil_status"
                                        defaultValue=""
                                        className={selectClassName}
                                    >
                                        <option value="" disabled>
                                            Select civil status
                                        </option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">
                                            Divorced
                                        </option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
                                    <InputError
                                        message={displayErrors.civil_status}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">
                                        Home address{' '}
                                        <span
                                            className="text-destructive"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        placeholder="e.g. 123 Rizal Street, Manila"
                                        rows={1}
                                        className="h-11 w-full resize-none rounded-md border border-primary/20 bg-background/80 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                    />
                                    <InputError
                                        message={displayErrors.address}
                                    />
                                </div>
                            </div>
                            <div
                                className={
                                    step === 3
                                        ? 'grid gap-5'
                                        : 'hidden'
                                }
                            >
                                <Field
                                    id="contact_number"
                                    label="Contact number"
                                    error={displayErrors.contact_number}
                                    placeholder="e.g. 09171234567"
                                    inputMode="numeric"
                                />
                                <Field
                                    id="email"
                                    label="Email"
                                    placeholder="e.g. juan@example.com"
                                    error={displayErrors.email}
                                    type="email"
                                    autoComplete="email"
                                    
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        Password{' '}
                                        <span
                                            className="text-destructive"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
                                        passwordrules={passwordRules}
                                        className={inputClassName}
                                    />
                                    <InputError
                                        message={displayErrors.password}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password{' '}
                                        <span
                                            className="text-destructive"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        autoComplete="new-password"
                                        passwordrules={passwordRules}
                                        className={inputClassName}
                                    />
                                    <InputError
                                        message={
                                            displayErrors.password_confirmation
                                        }
                                    />
                                </div>
                                <input
                                    type="hidden"
                                    name="privacy_accepted"
                                    value={privacyAccepted ? '1' : ''}
                                />
                                <div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="privacy_accepted"
                                            checked={privacyAccepted}
                                        />
                                        <Label
                                            htmlFor="privacy_accepted" className="font-normal text-foreground">
                                            I have read and agree to the{' '}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (validateStep(3)) {
                                                        setPrivacyOpen(true);
                                                    }
                                                }}
                                                className="font-semibold text-primary underline underline-offset-4 opacity-100"
                                            >
                                                Privacy Notice
                                            </button>
                                            <span
                                                className="text-destructive"
                                                aria-hidden="true"
                                            >
                                            </span>
                                        </Label>
                                    </div>
                                    <InputError
                                        message={displayErrors.privacy_accepted}
                                        className="mt-2"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-row items-center justify-end gap-3 pt-1">
                                {step > 1 && (
                                    <Button
                                        type="button"
                                        className="bg-foreground text-background hover:bg-foreground/90"
                                        onClick={() => {
                                            setClientErrors({});
                                            setStep(step - 1);
                                        }}
                                    >
                                        Back
                                    </Button>
                                )}
                                {step < 3 ? (
                                    <Button
                                        type="button"
                                        onClick={continueToNextStep}
                                    >
                                        Continue
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing || !privacyAccepted
                                        }
                                        data-test="register-button"
                                    >
                                        {processing && <Spinner />}Sign up
                                    </Button>
                                )}
                            </div>
                            <p className="border-t border-foreground/10 pt-4 text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <TextLink href={login()}>Log in</TextLink>
                            </p>
                        </>
                    );
                }}
            </Form>

            <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
                <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] max-h-[90svh] overflow-hidden border-primary/20 p-0 sm:w-full sm:max-w-2xl">
                    <DialogHeader className="px-5 py-5 pr-12">
                        <DialogTitle className="font-serif text-2xl italic">
                            {privacyNotice.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60svh] space-y-5 overflow-y-auto px-5 py-5">
                        {privacyNotice.sections.map((section, index) => (
                            <section key={`${section.title}-${index}`}>
                                <h2 className="font-semibold">
                                    {section.title}
                                </h2>
                                <p className="mt-2 text-justify text-sm leading-6 whitespace-pre-line text-muted-foreground">
                                    {section.content}
                                </p>
                            </section>
                        ))}
                        {privacyNotice.sections.length === 0 && (
                            <p className="text-justify text-sm leading-6 text-muted-foreground">
                                The clinic privacy notice has not been published
                                yet. Please contact the clinic before creating
                                an account.
                            </p>
                        )}
                    </div>
                    <div className="bg-primary/5 p-4">
                        <Button
                            type="button"
                            className="w-full"
                            disabled={privacyNotice.sections.length === 0}
                            onClick={() => {
                                setPrivacyAccepted(true);
                                setPrivacyOpen(false);
                            }}
                        >
                            <ShieldCheck className="size-4" />I have read the
                            Privacy Notice
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Stepper({ step }: { step: number }) {
    const steps = [
        { number: 1 },
        { number: 2 },
        { number: 3 },
    ];

    return (
        <div className="relative grid w-full grid-cols-3 gap-2">
            <span
                aria-hidden="true"
                className="absolute top-4 right-0 left-0 h-px bg-primary/25"
            />
            {steps.map((item) => {
                const active = item.number === step;
                const complete = item.number < step;
                const alignment =
                    item.number === 1
                        ? 'justify-items-start text-left'
                        : item.number === 3
                          ? 'justify-items-end text-right'
                          : 'justify-items-center text-center';

                return (
                    <div
                        key={item.number}
                        className={`relative z-10 grid gap-2 text-xs font-semibold ${alignment} ${active || complete ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                        <span
                            className={`flex size-8 items-center justify-center rounded-full border text-xs ${active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : complete ? 'border-foreground bg-foreground text-background' : 'border-primary/30 bg-background'}`}
                        >
                            {complete ? (
                                <Check className="size-4" />
                            ) : (
                                item.number
                            )}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

Register.layout = {
    title: 'Create an account',
};
































