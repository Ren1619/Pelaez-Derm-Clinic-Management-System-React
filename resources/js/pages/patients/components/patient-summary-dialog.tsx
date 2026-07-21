import { Form } from '@inertiajs/react';
import {
    store as storeAllergy,
    update as updateAllergy,
} from '@/actions/App/Http/Controllers/PatientAllergyController';
import {
    store as storeCondition,
    update as updateCondition,
} from '@/actions/App/Http/Controllers/PatientMedicalConditionController';
import {
    store as storeMedication,
    update as updateMedication,
} from '@/actions/App/Http/Controllers/PatientMedicationController';
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
import type {
    Patient,
    PatientAllergy,
    PatientMedicalCondition,
    PatientMedication,
    PatientSummaryRecord,
} from '@/types';

export type PatientSummaryKind = 'medical-condition' | 'allergy' | 'medication';

type PatientSummaryDialogProps = {
    patient: Patient;
    kind: PatientSummaryKind;
    record: PatientSummaryRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const labels = {
    'medical-condition': 'Medical Condition',
    allergy: 'Allergy',
    medication: 'Medication',
};

export function PatientSummaryDialog({
    patient,
    kind,
    record,
    open,
    onOpenChange,
}: PatientSummaryDialogProps) {
    const isEdit = record !== null;
    const condition =
        kind === 'medical-condition'
            ? (record as PatientMedicalCondition | null)
            : null;
    const allergy =
        kind === 'allergy' ? (record as PatientAllergy | null) : null;
    const medication =
        kind === 'medication' ? (record as PatientMedication | null) : null;
    const form =
        kind === 'medical-condition'
            ? condition
                ? updateCondition.form({ patient, medicalCondition: condition })
                : storeCondition.form(patient)
            : kind === 'allergy'
              ? allergy
                  ? updateAllergy.form({ patient, allergy })
                  : storeAllergy.form(patient)
              : medication
                ? updateMedication.form({ patient, medication })
                : storeMedication.form(patient);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        <span className="text-[#F91D7C]">
                            {isEdit ? 'Edit' : 'Add'}
                        </span>{' '}
                        {labels[kind]}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update' : 'Add'} this entry in{' '}
                        {patient.full_name}&apos;s medical record.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...form}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    resetOnSuccess={!isEdit}
                    className="grid gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            {kind === 'medical-condition' && (
                                <Field
                                    label="Medical condition"
                                    error={errors.condition}
                                >
                                    <Input
                                        name="condition"
                                        defaultValue={
                                            condition?.condition ?? ''
                                        }
                                        placeholder="Enter medical condition"
                                        required
                                    />
                                </Field>
                            )}

                            {kind === 'allergy' && (
                                <Field label="Allergy" error={errors.allergy}>
                                    <Input
                                        name="allergy"
                                        defaultValue={allergy?.allergy ?? ''}
                                        placeholder="Enter allergy"
                                        required
                                    />
                                </Field>
                            )}

                            {kind === 'medication' && (
                                <>
                                    <Field
                                        label="Medication"
                                        error={errors.medication}
                                    >
                                        <Input
                                            name="medication"
                                            defaultValue={
                                                medication?.medication ?? ''
                                            }
                                            placeholder="Enter medication"
                                            required
                                        />
                                    </Field>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <Field
                                            label="Dosage"
                                            error={errors.dosage}
                                        >
                                            <Input
                                                name="dosage"
                                                defaultValue={
                                                    medication?.dosage ?? ''
                                                }
                                            />
                                        </Field>
                                        <Field
                                            label="Frequency"
                                            error={errors.frequency}
                                        >
                                            <Input
                                                name="frequency"
                                                defaultValue={
                                                    medication?.frequency ?? ''
                                                }
                                            />
                                        </Field>
                                        <Field
                                            label="Duration"
                                            error={errors.duration}
                                        >
                                            <Input
                                                name="duration"
                                                defaultValue={
                                                    medication?.duration ?? ''
                                                }
                                            />
                                        </Field>
                                    </div>
                                </>
                            )}

                            <Field label="Additional notes" error={errors.note}>
                                <textarea
                                    name="note"
                                    defaultValue={record?.note ?? ''}
                                    rows={4}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                    placeholder="Enter additional notes (optional)"
                                />
                            </Field>

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
                                    className="bg-[#F91D7C] hover:bg-[#e01a70]"
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

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
