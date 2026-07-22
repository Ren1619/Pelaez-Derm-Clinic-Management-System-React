import { Form } from '@inertiajs/react';
import {
    store as storeDiagnosis,
    update as updateDiagnosis,
} from '@/actions/App/Http/Controllers/PatientVisitDiagnosisController';
import {
    store as storePrescription,
    update as updatePrescription,
} from '@/actions/App/Http/Controllers/PatientVisitPrescriptionController';
import {
    store as storeProduct,
    update as updateProduct,
} from '@/actions/App/Http/Controllers/PatientVisitProductController';
import {
    store as storeService,
    update as updateService,
} from '@/actions/App/Http/Controllers/PatientVisitServiceController';
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
    PatientClinicalOptions,
    PatientVisit,
    PatientVisitDiagnosis,
    PatientVisitPrescription,
    PatientVisitProduct,
    PatientVisitRecord,
    PatientVisitService,
} from '@/types';

export type VisitRecordKind =
    'diagnosis' | 'prescription' | 'service' | 'product';

type PatientVisitRecordDialogProps = {
    patient: Patient;
    visit: PatientVisit;
    kind: VisitRecordKind;
    record: PatientVisitRecord | null;
    options: PatientClinicalOptions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const labels = {
    diagnosis: 'Diagnosis',
    prescription: 'Prescription',
    service: 'Visit Service',
    product: 'Visit Product',
};

export function PatientVisitRecordDialog({
    patient,
    visit,
    kind,
    record,
    options,
    open,
    onOpenChange,
}: PatientVisitRecordDialogProps) {
    const isEdit = record !== null;
    const diagnosis =
        kind === 'diagnosis' ? (record as PatientVisitDiagnosis | null) : null;
    const prescription =
        kind === 'prescription'
            ? (record as PatientVisitPrescription | null)
            : null;
    const service =
        kind === 'service' ? (record as PatientVisitService | null) : null;
    const product =
        kind === 'product' ? (record as PatientVisitProduct | null) : null;
    const availableProducts = options.products.filter(
        (option) =>
            option.branch_ID === visit.branch.branch_ID ||
            option.id === product?.product_ID,
    );
    const routeArguments = { patient, visit };
    const form =
        kind === 'diagnosis'
            ? diagnosis
                ? updateDiagnosis.form({ ...routeArguments, diagnosis })
                : storeDiagnosis.form(routeArguments)
            : kind === 'prescription'
              ? prescription
                  ? updatePrescription.form({ ...routeArguments, prescription })
                  : storePrescription.form(routeArguments)
              : kind === 'service'
                ? service
                    ? updateService.form({ ...routeArguments, service })
                    : storeService.form(routeArguments)
                : product
                  ? updateProduct.form({ ...routeArguments, product })
                  : storeProduct.form(routeArguments);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        <span className="text-primary">
                            {isEdit ? 'Edit' : 'Add'}
                        </span>{' '}
                        {labels[kind]}
                    </DialogTitle>
                    <DialogDescription>
                        {new Intl.DateTimeFormat('en-PH', {
                            dateStyle: 'medium',
                        }).format(new Date(visit.visited_at))}
                        {' · '}
                        {visit.branch.branch_name}
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
                            {kind === 'diagnosis' && (
                                <Field
                                    label="Diagnosis"
                                    error={errors.diagnosis}
                                >
                                    <Input
                                        name="diagnosis"
                                        defaultValue={
                                            diagnosis?.diagnosis ?? ''
                                        }
                                        placeholder="Enter diagnosis"
                                        required
                                    />
                                </Field>
                            )}

                            {kind === 'prescription' && (
                                <>
                                    <Field
                                        label="Prescription"
                                        error={errors.prescription}
                                    >
                                        <Input
                                            name="prescription"
                                            defaultValue={
                                                prescription?.prescription ?? ''
                                            }
                                            placeholder="Enter medicine or treatment"
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
                                                    prescription?.dosage ?? ''
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
                                                    prescription?.frequency ??
                                                    ''
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
                                                    prescription?.duration ?? ''
                                                }
                                            />
                                        </Field>
                                    </div>
                                </>
                            )}

                            {kind === 'service' && (
                                <>
                                    <Field
                                        label="Service"
                                        error={errors.service_ID}
                                    >
                                        <select
                                            name="service_ID"
                                            defaultValue={
                                                service?.service_ID ?? ''
                                            }
                                            className={selectClassName}
                                            required
                                        >
                                            <option value="" disabled>
                                                Select service
                                            </option>
                                            {options.services.map((option) => (
                                                <option
                                                    key={option.id}
                                                    value={option.id}
                                                >
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field
                                        label="Quantity"
                                        error={errors.quantity}
                                    >
                                        <Input
                                            type="number"
                                            name="quantity"
                                            min="1"
                                            max="99"
                                            defaultValue={
                                                service?.quantity ?? 1
                                            }
                                            required
                                        />
                                    </Field>
                                </>
                            )}

                            {kind === 'product' && (
                                <>
                                    <Field
                                        label="Product / medicine"
                                        error={errors.product_ID}
                                    >
                                        <select
                                            name="product_ID"
                                            defaultValue={
                                                product?.product_ID ?? ''
                                            }
                                            className={selectClassName}
                                            required
                                        >
                                            <option value="" disabled>
                                                Select product
                                            </option>
                                            {availableProducts.map((option) => (
                                                <option
                                                    key={option.id}
                                                    value={option.id}
                                                    disabled={
                                                        option.quantity === 0 &&
                                                        option.id !==
                                                            product?.product_ID
                                                    }
                                                >
                                                    {option.name} —{' '}
                                                    {option.quantity +
                                                        (option.id ===
                                                        product?.product_ID
                                                            ? product.quantity
                                                            : 0)}{' '}
                                                    available
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field
                                        label="Quantity"
                                        error={errors.quantity}
                                    >
                                        <Input
                                            type="number"
                                            name="quantity"
                                            min="1"
                                            max="999"
                                            defaultValue={
                                                product?.quantity ?? 1
                                            }
                                            required
                                        />
                                    </Field>
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
