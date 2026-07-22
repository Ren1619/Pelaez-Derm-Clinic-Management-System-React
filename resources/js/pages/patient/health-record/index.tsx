import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    destroyAllergy,
    destroyMedicalCondition,
    destroyMedication,
    index,
    storeAllergy,
    storeMedicalCondition,
    storeMedication,
    updateAllergy,
    updateMedicalCondition,
    updateMedication,
} from '@/actions/App/Http/Controllers/PatientHealthRecordController';
import InputError from '@/components/input-error';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
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
    PatientMedicalRecord,
    PatientMedication,
    PatientPosTransaction,
    PatientRecordFilters,
    PatientSummaryRecord,
    PatientVisit,
    PatientVisitPaginator,
} from '@/types';
import type { RouteFormDefinition } from '@/wayfinder';

type Props = {
    patient: Patient;
    medicalRecord: PatientMedicalRecord;
    latestVisit: PatientVisit | null;
    visits: PatientVisitPaginator;
    posTransactions: PatientPosTransaction[];
    filters: PatientRecordFilters;
};

type SummaryKind = 'medical-condition' | 'allergy' | 'medication';
type VisitTab = 'diagnosis' | 'prescription' | 'service' | 'product';
type EditState = {
    kind: SummaryKind;
    record: PatientSummaryRecord | null;
} | null;
type DeleteState = { title: string; form: RouteFormDefinition<'post'> } | null;

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
});
const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

export default function PatientHealthRecord({
    patient,
    medicalRecord,
    latestVisit,
    visits,
    posTransactions,
    filters,
}: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [editState, setEditState] = useState<EditState>(null);
    const [deleteState, setDeleteState] = useState<DeleteState>(null);

    const applyDates = (from: string, to: string) =>
        router.get(
            index.url(),
            {
                date_from: from || undefined,
                date_to: to || undefined,
                per_page: filters.per_page,
            },
            {
                only: ['visits', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );

    const confirmDelete = (kind: SummaryKind, record: PatientSummaryRecord) => {
        const form =
            kind === 'medical-condition'
                ? destroyMedicalCondition.form(
                      record as PatientMedicalCondition,
                  )
                : kind === 'allergy'
                  ? destroyAllergy.form(record as PatientAllergy)
                  : destroyMedication.form(record as PatientMedication);
        setDeleteState({ title: `Delete ${recordTitle(record)}?`, form });
    };

    return (
        <>
            <Head title="My Health Record" />
            <div className="grid gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2.05fr)]">
                <aside className="grid content-start gap-4">
                    <IdentityCard patient={patient} latestVisit={latestVisit} />
                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <SummaryAccordion
                            title="Medical Conditions"
                            kind="medical-condition"
                            items={medicalRecord.medical_conditions}
                            onAdd={() =>
                                setEditState({
                                    kind: 'medical-condition',
                                    record: null,
                                })
                            }
                            onEdit={(record) =>
                                setEditState({
                                    kind: 'medical-condition',
                                    record,
                                })
                            }
                            onDelete={(record) =>
                                confirmDelete('medical-condition', record)
                            }
                        />
                        <SummaryAccordion
                            title="Allergies"
                            kind="allergy"
                            items={medicalRecord.allergies}
                            onAdd={() =>
                                setEditState({ kind: 'allergy', record: null })
                            }
                            onEdit={(record) =>
                                setEditState({ kind: 'allergy', record })
                            }
                            onDelete={(record) =>
                                confirmDelete('allergy', record)
                            }
                        />
                        <SummaryAccordion
                            title="Medications"
                            kind="medication"
                            items={medicalRecord.medications}
                            onAdd={() =>
                                setEditState({
                                    kind: 'medication',
                                    record: null,
                                })
                            }
                            onEdit={(record) =>
                                setEditState({ kind: 'medication', record })
                            }
                            onDelete={(record) =>
                                confirmDelete('medication', record)
                            }
                        />
                        <TransactionAccordion
                            visits={visits.data}
                            transactions={posTransactions}
                        />
                    </div>
                </aside>

                <section className="min-w-0">
                    <div className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex flex-wrap items-end gap-3">
                            <DateField
                                label="From"
                                value={dateFrom}
                                onChange={(value) => {
                                    setDateFrom(value);
                                    applyDates(value, dateTo);
                                }}
                            />
                            <DateField
                                label="To"
                                value={dateTo}
                                onChange={(value) => {
                                    setDateTo(value);
                                    applyDates(dateFrom, value);
                                }}
                            />
                            {(dateFrom || dateTo) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setDateFrom('');
                                        setDateTo('');
                                        applyDates('', '');
                                    }}
                                >
                                    Clear dates
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {visits.data.map((visit, position) => (
                            <VisitCard
                                key={visit.visit_ID}
                                visit={visit}
                                isLatest={
                                    latestVisit?.visit_ID === visit.visit_ID
                                }
                                defaultOpen={position === 0}
                            />
                        ))}
                        {visits.data.length === 0 && (
                            <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
                                No visit history is available for this date
                                range.
                            </div>
                        )}
                        <Pagination visits={visits} filters={filters} />
                    </div>
                </section>
            </div>

            {editState && (
                <SummaryDialog
                    key={`${editState.kind}-${recordId(editState.record)}`}
                    state={editState}
                    open
                    onOpenChange={(open) => !open && setEditState(null)}
                />
            )}
            <Dialog
                open={deleteState !== null}
                onOpenChange={(open) => !open && setDeleteState(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{deleteState?.title}</DialogTitle>
                        <DialogDescription>
                            This entry will be removed from your health record.
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteState && (
                        <Form
                            {...deleteState.form}
                            options={{ preserveScroll: true }}
                            onSuccess={() => setDeleteState(null)}
                        >
                            {({ processing }) => (
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDeleteState(null)}
                                    >
                                        Cancel
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
        </>
    );
}

function IdentityCard({
    patient,
    latestVisit,
}: {
    patient: Patient;
    latestVisit: PatientVisit | null;
}) {
    const [open, setOpen] = useState(false);

    return (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-6 text-xl font-bold">
                <span className="text-primary">
                    {patient.first_name}
                    {patient.middle_name ? ` ${patient.middle_name}` : ''}
                </span>{' '}
                {patient.last_name}
            </h2>
            <div className="grid gap-1 text-sm">
                <p>
                    <b>Sex:</b>{' '}
                    <span className="text-muted-foreground">{patient.sex}</span>
                </p>
                <p>
                    <b>Date of Birth:</b>{' '}
                    <span className="text-muted-foreground">
                        {dateFormatter.format(
                            new Date(`${patient.date_of_birth}T00:00:00`),
                        )}
                    </span>
                </p>
            </div>
            <button
                type="button"
                className="mt-4 flex w-full items-center justify-between border-t pt-4 text-left font-medium"
                onClick={() => setOpen(!open)}
            >
                More Info{' '}
                {open ? (
                    <ChevronUp className="size-4" />
                ) : (
                    <ChevronDown className="size-4" />
                )}
            </button>
            {open && (
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <p>
                        <b className="text-foreground">Contact:</b>{' '}
                        {patient.contact_number}
                    </p>
                    <p>
                        <b className="text-foreground">Email:</b>{' '}
                        {patient.email}
                    </p>
                    <p>
                        <b className="text-foreground">Address:</b>{' '}
                        {patient.address}
                    </p>
                    <p>
                        <b className="text-foreground">Civil status:</b>{' '}
                        {patient.civil_status}
                    </p>
                    <p>
                        <b className="text-foreground">Last visit:</b>{' '}
                        {latestVisit
                            ? `${dateFormatter.format(new Date(latestVisit.visited_at))} · ${latestVisit.branch.branch_name}`
                            : 'No visits yet'}
                    </p>
                </div>
            )}
        </section>
    );
}

function SummaryAccordion({
    title,
    kind,
    items,
    onAdd,
    onEdit,
    onDelete,
}: {
    title: string;
    kind: SummaryKind;
    items: PatientSummaryRecord[];
    onAdd: () => void;
    onEdit: (record: PatientSummaryRecord) => void;
    onDelete: (record: PatientSummaryRecord) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = items.filter((item) =>
        recordTitle(item).toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <section className="border-b last:border-b-0">
            <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/40"
                onClick={() => setOpen(!open)}
            >
                {title}
                {open ? (
                    <ChevronUp className="size-4" />
                ) : (
                    <ChevronDown className="size-4" />
                )}
            </button>
            {open && (
                <div className="grid gap-3 border-t p-4">
                    <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="pl-8"
                                placeholder={`Search ${title.toLowerCase()}`}
                            />
                        </div>
                        <TooltipIconButton
                            size="icon"
                            tooltip={`Add ${kind}`}
                            onClick={onAdd}
                            aria-label={`Add ${kind}`}
                        >
                            <Plus />
                        </TooltipIconButton>
                    </div>
                    {filtered.map((item) => (
                        <div
                            key={recordId(item)}
                            className="rounded-md border p-3 text-sm"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <b>{recordTitle(item)}</b>
                                <div className="flex">
                                    <TooltipIconButton
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        tooltip={`Edit ${recordTitle(item)}`}
                                        onClick={() => onEdit(item)}
                                    >
                                        <Pencil className="size-4" />
                                    </TooltipIconButton>
                                    <TooltipIconButton
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive"
                                        tooltip={`Delete ${recordTitle(item)}`}
                                        onClick={() => onDelete(item)}
                                    >
                                        <Trash2 className="size-4" />
                                    </TooltipIconButton>
                                </div>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                                {recordDetail(item) || 'No additional details'}
                            </p>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            No {title.toLowerCase()} found.
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}

function VisitCard({
    visit,
    isLatest,
    defaultOpen,
}: {
    visit: PatientVisit;
    isLatest: boolean;
    defaultOpen: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [tab, setTab] = useState<VisitTab>('diagnosis');
    const [search, setSearch] = useState('');
    const records = useMemo(
        () =>
            visitRecords(visit, tab).filter((record) =>
                record.title.toLowerCase().includes(search.toLowerCase()),
            ),
        [visit, tab, search],
    );

    return (
        <article className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <button
                type="button"
                className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                onClick={() => setOpen(!open)}
            >
                <div>
                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                        {dateFormatter.format(new Date(visit.visited_at))}
                        {isLatest && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                Last visit
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {visit.branch.branch_name}
                        {visit.doctor.name ? ` · ${visit.doctor.name}` : ''}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span>BP: {visit.blood_pressure ?? 'N/A'}</span>
                    <span>
                        Weight:{' '}
                        {visit.weight ? `${Number(visit.weight)} kg` : 'N/A'}
                    </span>
                    <span>
                        Height:{' '}
                        {visit.height ? `${Number(visit.height)} cm` : 'N/A'}
                    </span>
                    {open ? (
                        <ChevronUp className="size-4" />
                    ) : (
                        <ChevronDown className="size-4" />
                    )}
                </div>
            </button>
            {open && (
                <div className="border-t p-4">
                    <nav className="mb-5 flex overflow-x-auto border-b">
                        {(
                            [
                                'diagnosis',
                                'prescription',
                                'service',
                                'product',
                            ] as VisitTab[]
                        ).map((item) => (
                            <button
                                type="button"
                                key={item}
                                onClick={() => {
                                    setTab(item);
                                    setSearch('');
                                }}
                                className={`border-b-2 px-4 py-3 text-sm capitalize ${tab === item ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                            >
                                {item === 'prescription'
                                    ? 'Prescriptions'
                                    : `${item[0].toUpperCase()}${item.slice(1)}${item === 'diagnosis' ? '' : 's'}`}
                            </button>
                        ))}
                    </nav>
                    <div className="relative mb-4 max-w-xs">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={`Search ${tab}`}
                        />
                    </div>
                    <div className="grid gap-3">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="rounded-lg border p-3"
                            >
                                <b>{record.title}</b>
                                {record.meta && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {record.meta}
                                    </p>
                                )}
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {record.note || 'No additional notes'}
                                </p>
                            </div>
                        ))}
                        {records.length === 0 && (
                            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No {tab} records found.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </article>
    );
}

function SummaryDialog({
    state,
    open,
    onOpenChange,
}: {
    state: NonNullable<EditState>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const record = state.record;
    const condition =
        state.kind === 'medical-condition'
            ? (record as PatientMedicalCondition | null)
            : null;
    const allergy =
        state.kind === 'allergy' ? (record as PatientAllergy | null) : null;
    const medication =
        state.kind === 'medication'
            ? (record as PatientMedication | null)
            : null;
    const form =
        state.kind === 'medical-condition'
            ? condition
                ? updateMedicalCondition.form(condition)
                : storeMedicalCondition.form()
            : state.kind === 'allergy'
              ? allergy
                  ? updateAllergy.form(allergy)
                  : storeAllergy.form()
              : medication
                ? updateMedication.form(medication)
                : storeMedication.form();
    const label =
        state.kind === 'medical-condition'
            ? 'Medical Condition'
            : state.kind === 'allergy'
              ? 'Allergy'
              : 'Medication';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {record ? 'Edit' : 'Add'} {label}
                    </DialogTitle>
                    <DialogDescription>
                        Keep your health summary accurate for clinic staff.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...form}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    resetOnSuccess={!record}
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
                            {state.kind === 'medical-condition' && (
                                <Field
                                    label="Medical condition"
                                    error={errors.condition}
                                    required
                                >
                                    <Input
                                        name="condition"
                                        defaultValue={
                                            condition?.condition ?? ''
                                        }
                                        required
                                    />
                                </Field>
                            )}
                            {state.kind === 'allergy' && (
                                <Field
                                    label="Allergy"
                                    error={errors.allergy}
                                    required
                                >
                                    <Input
                                        name="allergy"
                                        defaultValue={allergy?.allergy ?? ''}
                                        required
                                    />
                                </Field>
                            )}
                            {state.kind === 'medication' && (
                                <>
                                    <Field
                                        label="Medication"
                                        error={errors.medication}
                                        required
                                    >
                                        <Input
                                            name="medication"
                                            defaultValue={
                                                medication?.medication ?? ''
                                            }
                                            required
                                        />
                                    </Field>
                                    <div className="grid gap-3 sm:grid-cols-3">
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
                                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                                />
                            </Field>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {record ? 'Update' : 'Add'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function TransactionAccordion({
    visits,
    transactions,
}: {
    visits: PatientVisit[];
    transactions: PatientPosTransaction[];
}) {
    const [open, setOpen] = useState(false);
    const entries = [
        ...visits.flatMap((visit) => [
            ...visit.services.map((item) => ({
                id: `vs-${item.visit_service_ID}`,
                date: visit.visited_at,
                title: item.service_name,
                detail: `Visit service · Qty ${item.quantity}`,
            })),
            ...visit.products.map((item) => ({
                id: `vp-${item.visit_product_ID}`,
                date: visit.visited_at,
                title: item.product_name,
                detail: `Visit product · Qty ${item.quantity}`,
            })),
        ]),
        ...transactions.flatMap((sale) => [
            ...sale.services.map((item) => ({
                id: `ss-${sale.sale_ID}-${item.item_ID}`,
                date: sale.created_at,
                title: item.name,
                detail: `${sale.branch_name} · Qty ${item.quantity} · ${currencyFormatter.format(Number(item.subtotal))}`,
            })),
            ...sale.products.map((item) => ({
                id: `sp-${sale.sale_ID}-${item.item_ID}`,
                date: sale.created_at,
                title: item.name,
                detail: `${sale.branch_name} · Qty ${item.quantity} · ${currencyFormatter.format(Number(item.subtotal))}`,
            })),
        ]),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <section>
            <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/40"
                onClick={() => setOpen(!open)}
            >
                Transaction History
                {open ? (
                    <ChevronUp className="size-4" />
                ) : (
                    <ChevronDown className="size-4" />
                )}
            </button>
            {open && (
                <div className="grid max-h-80 gap-2 overflow-y-auto border-t p-4">
                    {entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="rounded-md border p-3 text-sm"
                        >
                            <div className="flex justify-between gap-2">
                                <b>{entry.title}</b>
                                <span className="text-xs text-muted-foreground">
                                    {dateFormatter.format(new Date(entry.date))}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {entry.detail}
                            </p>
                        </div>
                    ))}
                    {entries.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            No transactions found.
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}

function Pagination({
    visits,
    filters,
}: {
    visits: PatientVisitPaginator;
    filters: PatientRecordFilters;
}) {
    if (visits.last_page <= 1) {
        return null;
    }

    const route = (page: number) =>
        index({
            query: {
                page,
                per_page: filters.per_page,
                date_from: filters.date_from,
                date_to: filters.date_to,
            },
        });

    return (
        <div className="flex items-center justify-between border-t pt-4 text-sm">
            <span className="text-muted-foreground">
                {visits.from ?? 0}–{visits.to ?? 0} of {visits.total} visits
            </span>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    asChild={visits.current_page > 1}
                    disabled={visits.current_page <= 1}
                >
                    {visits.current_page > 1 ? (
                        <Link
                            href={route(visits.current_page - 1)}
                            preserveScroll
                            only={['visits', 'filters']}
                        >
                            <ChevronLeft /> Previous
                        </Link>
                    ) : (
                        <>
                            <ChevronLeft /> Previous
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    asChild={visits.current_page < visits.last_page}
                    disabled={visits.current_page >= visits.last_page}
                >
                    {visits.current_page < visits.last_page ? (
                        <Link
                            href={route(visits.current_page + 1)}
                            preserveScroll
                            only={['visits', 'filters']}
                        >
                            Next <ChevronRight />
                        </Link>
                    ) : (
                        <>
                            Next <ChevronRight />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

function DateField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <Input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-40"
            />
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
function recordId(record: PatientSummaryRecord | null): string | number {
    if (!record) {
        return 'new';
    }

    if ('medical_condition_ID' in record) {
        return record.medical_condition_ID;
    }

    if ('allergy_ID' in record) {
        return record.allergy_ID;
    }

    return record.medication_ID;
}
function recordTitle(record: PatientSummaryRecord): string {
    if ('condition' in record) {
        return record.condition;
    }

    if ('allergy' in record) {
        return record.allergy;
    }

    return record.medication;
}
function recordDetail(record: PatientSummaryRecord): string {
    return 'medication' in record
        ? [record.dosage, record.frequency, record.duration, record.note]
              .filter(Boolean)
              .join(' · ')
        : (record.note ?? '');
}
function visitRecords(visit: PatientVisit, tab: VisitTab) {
    if (tab === 'diagnosis') {
        return visit.diagnoses.map((item) => ({
            id: item.diagnosis_ID,
            title: item.diagnosis,
            meta: '',
            note: item.note,
        }));
    }

    if (tab === 'prescription') {
        return visit.prescriptions.map((item) => ({
            id: item.prescription_ID,
            title: item.prescription,
            meta: [item.dosage, item.frequency, item.duration]
                .filter(Boolean)
                .join(' · '),
            note: item.note,
        }));
    }

    if (tab === 'service') {
        return visit.services.map((item) => ({
            id: item.visit_service_ID,
            title: item.service_name,
            meta: `Quantity: ${item.quantity}`,
            note: item.note,
        }));
    }

    return visit.products.map((item) => ({
        id: item.visit_product_ID,
        title: item.product_name,
        meta: `Quantity: ${item.quantity}${item.unit_price ? ` · ${currencyFormatter.format(Number(item.unit_price))}` : ''}`,
        note: item.note,
    }));
}
