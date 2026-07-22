import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { destroy as destroyAllergy } from '@/actions/App/Http/Controllers/PatientAllergyController';
import { destroy as destroyCondition } from '@/actions/App/Http/Controllers/PatientMedicalConditionController';
import { destroy as destroyMedication } from '@/actions/App/Http/Controllers/PatientMedicationController';
import { destroy as destroyVisit } from '@/actions/App/Http/Controllers/PatientVisitController';
import { destroy as destroyDiagnosis } from '@/actions/App/Http/Controllers/PatientVisitDiagnosisController';
import { destroy as destroyPrescription } from '@/actions/App/Http/Controllers/PatientVisitPrescriptionController';
import { destroy as destroyProduct } from '@/actions/App/Http/Controllers/PatientVisitProductController';
import { destroy as destroyService } from '@/actions/App/Http/Controllers/PatientVisitServiceController';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { index, show } from '@/routes/patients';
import type {
    Patient,
    PatientAllergy,
    PatientClinicalOptions,
    PatientMedicalCondition,
    PatientMedicalRecord,
    PatientMedication,
    PatientPosTransaction,
    PatientRecordFilters,
    PatientSummaryRecord,
    PatientVisit,
    PatientVisitDiagnosis,
    PatientVisitPaginator,
    PatientVisitPrescription,
    PatientVisitProduct,
    PatientVisitRecord,
    PatientVisitService,
} from '@/types';
import type { RouteFormDefinition } from '@/wayfinder';
import { ClinicalRecordDeleteDialog } from './components/clinical-record-delete-dialog';
import { PatientRecordPagination } from './components/patient-record-pagination';
import { PatientSummaryDialog } from './components/patient-summary-dialog';
import type { PatientSummaryKind } from './components/patient-summary-dialog';
import { PatientVisitDialog } from './components/patient-visit-dialog';
import { PatientVisitRecordDialog } from './components/patient-visit-record-dialog';
import type { VisitRecordKind } from './components/patient-visit-record-dialog';

type PatientRecordShowProps = {
    patient: Patient;
    medicalRecord: PatientMedicalRecord;
    latestVisit: PatientVisit | null;
    visits: PatientVisitPaginator;
    filters: PatientRecordFilters;
    clinicalOptions: PatientClinicalOptions;
    posTransactions: PatientPosTransaction[];
};

type DeleteState = {
    title: string;
    description: string;
    form: RouteFormDefinition<'post'>;
} | null;

type SummaryDialogState = {
    kind: PatientSummaryKind;
    record: PatientSummaryRecord | null;
} | null;

type VisitRecordDialogState = {
    kind: VisitRecordKind;
    visit: PatientVisit;
    record: PatientVisitRecord | null;
} | null;

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
});

const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

export default function PatientRecordShow({
    patient,
    medicalRecord,
    latestVisit,
    visits,
    filters,
    clinicalOptions,
    posTransactions,
}: PatientRecordShowProps) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [summaryDialog, setSummaryDialog] =
        useState<SummaryDialogState>(null);
    const [visitDialog, setVisitDialog] = useState<PatientVisit | null>(null);
    const [visitDialogOpen, setVisitDialogOpen] = useState(false);
    const [visitRecordDialog, setVisitRecordDialog] =
        useState<VisitRecordDialogState>(null);
    const [deleteState, setDeleteState] = useState<DeleteState>(null);

    const applyDateFilter = (nextFrom: string, nextTo: string) => {
        router.get(
            show.url(patient),
            {
                date_from: nextFrom || undefined,
                date_to: nextTo || undefined,
                per_page: filters.per_page,
            },
            {
                only: ['visits', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const openVisitDialog = (visit: PatientVisit | null) => {
        setVisitDialog(visit);
        setVisitDialogOpen(true);
    };

    const deleteSummaryRecord = (
        kind: PatientSummaryKind,
        record: PatientSummaryRecord,
    ) => {
        const title = summaryRecordTitle(record);
        const form =
            kind === 'medical-condition'
                ? destroyCondition.form({
                      patient,
                      medicalCondition: record as PatientMedicalCondition,
                  })
                : kind === 'allergy'
                  ? destroyAllergy.form({
                        patient,
                        allergy: record as PatientAllergy,
                    })
                  : destroyMedication.form({
                        patient,
                        medication: record as PatientMedication,
                    });

        setDeleteState({
            title: `Delete ${title}?`,
            description:
                'This entry will be removed from the patient medical record. This action cannot be undone.',
            form,
        });
    };

    const deleteVisitRecord = (
        kind: VisitRecordKind,
        visit: PatientVisit,
        record: PatientVisitRecord,
    ) => {
        const routeArguments = { patient, visit };
        const form =
            kind === 'diagnosis'
                ? destroyDiagnosis.form({
                      ...routeArguments,
                      diagnosis: record as PatientVisitDiagnosis,
                  })
                : kind === 'prescription'
                  ? destroyPrescription.form({
                        ...routeArguments,
                        prescription: record as PatientVisitPrescription,
                    })
                  : kind === 'service'
                    ? destroyService.form({
                          ...routeArguments,
                          service: record as PatientVisitService,
                      })
                    : destroyProduct.form({
                          ...routeArguments,
                          product: record as PatientVisitProduct,
                      });

        setDeleteState({
            title: `Delete ${visitRecordTitle(record)}?`,
            description:
                kind === 'product'
                    ? 'This purchase will be removed and its quantity returned to inventory.'
                    : 'This visit entry will be permanently removed.',
            form,
        });
    };

    return (
        <>
            <Head title={`${patient.full_name} — Patient Details`} />

            <div className="min-h-full bg-muted/30 p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2.05fr)]">
                    <aside className="grid content-start gap-4">
                        <PatientIdentityCard patient={patient} />

                        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                            <SummaryAccordion
                                title="Medical Conditions"
                                kind="medical-condition"
                                items={medicalRecord.medical_conditions}
                                onAdd={() =>
                                    setSummaryDialog({
                                        kind: 'medical-condition',
                                        record: null,
                                    })
                                }
                                onEdit={(record) =>
                                    setSummaryDialog({
                                        kind: 'medical-condition',
                                        record,
                                    })
                                }
                                onDelete={(record) =>
                                    deleteSummaryRecord(
                                        'medical-condition',
                                        record,
                                    )
                                }
                            />
                            <SummaryAccordion
                                title="Allergies"
                                kind="allergy"
                                items={medicalRecord.allergies}
                                onAdd={() =>
                                    setSummaryDialog({
                                        kind: 'allergy',
                                        record: null,
                                    })
                                }
                                onEdit={(record) =>
                                    setSummaryDialog({
                                        kind: 'allergy',
                                        record,
                                    })
                                }
                                onDelete={(record) =>
                                    deleteSummaryRecord('allergy', record)
                                }
                            />
                            <SummaryAccordion
                                title="Medications"
                                kind="medication"
                                items={medicalRecord.medications}
                                onAdd={() =>
                                    setSummaryDialog({
                                        kind: 'medication',
                                        record: null,
                                    })
                                }
                                onEdit={(record) =>
                                    setSummaryDialog({
                                        kind: 'medication',
                                        record,
                                    })
                                }
                                onDelete={(record) =>
                                    deleteSummaryRecord('medication', record)
                                }
                            />
                            <TransactionAccordion
                                visits={visits.data}
                                posTransactions={posTransactions}
                            />
                        </div>
                    </aside>

                    <main className="min-w-0">
                        <div className="mb-5 rounded-lg border bg-card p-4 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setDateFrom(value);
                                            applyDateFilter(value, dateTo);
                                        }}
                                        className="w-[160px]"
                                        aria-label="Visit date from"
                                    />
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setDateTo(value);
                                            applyDateFilter(dateFrom, value);
                                        }}
                                        className="w-[160px]"
                                        aria-label="Visit date to"
                                    />
                                    {(dateFrom || dateTo) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => {
                                                setDateFrom('');
                                                setDateTo('');
                                                applyDateFilter('', '');
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>

                                <Button
                                    onClick={() => openVisitDialog(null)}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <Plus /> Visit
                                </Button>
                            </div>
                        </div>

                        {visits.data.length > 0 ? (
                            <div className="grid gap-4">
                                {visits.data.map((visit, indexValue) => (
                                    <VisitCard
                                        key={visit.visit_ID}
                                        visit={visit}
                                        isLatest={
                                            latestVisit?.visit_ID ===
                                            visit.visit_ID
                                        }
                                        defaultOpen={indexValue === 0}
                                        onEditVisit={() =>
                                            openVisitDialog(visit)
                                        }
                                        onDeleteVisit={() =>
                                            setDeleteState({
                                                title: `Delete visit from ${dateFormatter.format(new Date(visit.visited_at))}?`,
                                                description:
                                                    'The visit and all of its diagnoses, prescriptions, services, and products will be removed.',
                                                form: destroyVisit.form({
                                                    patient,
                                                    visit,
                                                }),
                                            })
                                        }
                                        onAddRecord={(kind) =>
                                            setVisitRecordDialog({
                                                kind,
                                                visit,
                                                record: null,
                                            })
                                        }
                                        onEditRecord={(kind, record) =>
                                            setVisitRecordDialog({
                                                kind,
                                                visit,
                                                record,
                                            })
                                        }
                                        onDeleteRecord={(kind, record) =>
                                            deleteVisitRecord(
                                                kind,
                                                visit,
                                                record,
                                            )
                                        }
                                    />
                                ))}

                                <PatientRecordPagination
                                    patient={patient}
                                    visits={visits}
                                    filters={filters}
                                />
                            </div>
                        ) : (
                            <div className="rounded-lg border bg-card px-6 py-16 text-center text-sm text-muted-foreground shadow-sm">
                                {dateFrom || dateTo
                                    ? 'No visits were found in this date range.'
                                    : 'No visit history is available.'}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {summaryDialog && (
                <PatientSummaryDialog
                    key={`${summaryDialog.kind}-${summaryRecordId(summaryDialog.record)}`}
                    patient={patient}
                    kind={summaryDialog.kind}
                    record={summaryDialog.record}
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setSummaryDialog(null);
                        }
                    }}
                />
            )}

            <PatientVisitDialog
                key={visitDialog?.visit_ID ?? 'new'}
                patient={patient}
                visit={visitDialog}
                options={clinicalOptions}
                open={visitDialogOpen}
                onOpenChange={setVisitDialogOpen}
            />

            {visitRecordDialog && (
                <PatientVisitRecordDialog
                    key={`${visitRecordDialog.kind}-${visitRecordId(visitRecordDialog.record)}`}
                    patient={patient}
                    visit={visitRecordDialog.visit}
                    kind={visitRecordDialog.kind}
                    record={visitRecordDialog.record}
                    options={clinicalOptions}
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setVisitRecordDialog(null);
                        }
                    }}
                />
            )}

            <ClinicalRecordDeleteDialog
                open={deleteState !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteState(null);
                    }
                }}
                title={deleteState?.title ?? ''}
                description={deleteState?.description ?? ''}
                form={deleteState?.form ?? null}
            />
        </>
    );
}

function PatientIdentityCard({ patient }: { patient: Patient }) {
    const [moreInfoOpen, setMoreInfoOpen] = useState(false);

    return (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-7 flex items-center gap-3">
                <TooltipIconButton
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    asChild
                    tooltip="Back to patient records"
                >
                    <Link href={index()} aria-label="Back to patient records">
                        <ArrowLeft className="size-5" />
                    </Link>
                </TooltipIconButton>
                <h1 className="text-xl font-bold sm:text-2xl">
                    <span className="text-primary">
                        {patient.first_name}
                        {patient.middle_name ? ` ${patient.middle_name}` : ''}
                    </span>{' '}
                    {patient.last_name}
                </h1>
            </div>

            <div className="mb-4 grid gap-1 text-sm">
                <p>
                    <span className="font-medium">Sex:</span>{' '}
                    <span className="text-muted-foreground">{patient.sex}</span>
                </p>
                <p>
                    <span className="font-medium">Date of Birth:</span>{' '}
                    <span className="text-muted-foreground">
                        {formatDateOnly(patient.date_of_birth)}
                    </span>
                </p>
            </div>

            <div className="border-t">
                <button
                    type="button"
                    className="flex w-full items-center justify-between py-4 text-left font-medium hover:text-primary"
                    onClick={() => setMoreInfoOpen((open) => !open)}
                    aria-expanded={moreInfoOpen}
                >
                    More Info
                    {moreInfoOpen ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                </button>
                {moreInfoOpen && (
                    <div className="grid gap-1 pb-2 text-sm">
                        <InfoRow label="Email">
                            <a
                                href={`mailto:${patient.email}`}
                                className="break-all hover:underline"
                            >
                                {patient.email}
                            </a>
                        </InfoRow>
                        <InfoRow label="Contact Number">
                            <a
                                href={`tel:${patient.contact_number}`}
                                className="hover:underline"
                            >
                                {patient.contact_number}
                            </a>
                        </InfoRow>
                        <InfoRow label="Address">{patient.address}</InfoRow>
                        <InfoRow label="Civil Status">
                            {patient.civil_status}
                        </InfoRow>
                    </div>
                )}
            </div>
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
    kind: PatientSummaryKind;
    items: PatientSummaryRecord[];
    onAdd: () => void;
    onEdit: (record: PatientSummaryRecord) => void;
    onDelete: (record: PatientSummaryRecord) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filteredItems = items.filter((item) =>
        summaryRecordTitle(item)
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase()),
    );

    return (
        <section className="border-b last:border-b-0">
            <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/40"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
            >
                {title}
                {open ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                )}
            </button>

            {open && (
                <div className="grid gap-3 border-t p-4">
                    <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1">
                            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder={`Search ${title.toLowerCase()}...`}
                                className="pl-8"
                            />
                        </div>
                        <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={onAdd}
                        >
                            <Plus />{' '}
                            <span className="sr-only sm:not-sr-only">
                                {kind === 'medical-condition'
                                    ? 'Condition'
                                    : title.replace(/s$/, '')}
                            </span>
                        </Button>
                    </div>

                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <div
                                key={summaryRecordId(item)}
                                className="rounded-md border p-3 text-sm shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-2 border-b pb-2">
                                    <span className="font-semibold">
                                        {summaryRecordTitle(item)}
                                    </span>
                                    <div className="flex gap-1">
                                        <IconAction
                                            label="Edit"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Pencil className="size-4 text-green-600" />
                                        </IconAction>
                                        <IconAction
                                            label="Delete"
                                            onClick={() => onDelete(item)}
                                        >
                                            <Trash2 className="size-4 text-red-500" />
                                        </IconAction>
                                    </div>
                                </div>
                                <p className="pt-2 text-muted-foreground">
                                    {summaryRecordDetail(item) || 'N/A'}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="py-5 text-center text-sm text-muted-foreground">
                            {search
                                ? 'No matching records found.'
                                : `No ${title.toLowerCase()} found.`}
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}

function TransactionAccordion({
    visits,
    posTransactions,
}: {
    visits: PatientVisit[];
    posTransactions: PatientPosTransaction[];
}) {
    const [open, setOpen] = useState(false);
    const visitTransactions = visits.flatMap((visit) => [
        ...visit.services.map((service) => ({
            id: `service-${service.visit_service_ID}`,
            date: visit.visited_at,
            title: service.service_name,
            detail: `Service · Qty ${service.quantity}`,
        })),
        ...visit.products.map((product) => ({
            id: `product-${product.visit_product_ID}`,
            date: visit.visited_at,
            title: product.product_name,
            detail: `Product · Qty ${product.quantity}${product.unit_price ? ` · ${currencyFormatter.format(Number(product.unit_price))}` : ''}`,
        })),
    ]);
    const saleTransactions = posTransactions.flatMap((sale) => [
        ...sale.services.map((service) => ({
            id: `pos-${sale.sale_ID}-service-${service.item_ID}`,
            date: sale.created_at,
            title: service.name,
            detail: `POS Service · Qty ${service.quantity} · ${currencyFormatter.format(Number(service.subtotal))} · ${sale.branch_name}${sale.is_voided ? ' · Voided' : ''}`,
        })),
        ...sale.products.map((product) => ({
            id: `pos-${sale.sale_ID}-product-${product.item_ID}`,
            date: sale.created_at,
            title: product.name,
            detail: `POS Product · Qty ${product.quantity} · ${currencyFormatter.format(Number(product.subtotal))} · ${sale.branch_name}${sale.is_voided ? ' · Voided' : ''}`,
        })),
    ]);
    const transactions = [...visitTransactions, ...saleTransactions].sort(
        (left, right) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
    );

    return (
        <section>
            <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/40"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
            >
                Transaction History
                {open ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                )}
            </button>
            {open && (
                <div className="grid max-h-80 gap-2 overflow-y-auto border-t p-4">
                    {transactions.length > 0 ? (
                        transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="rounded-md border p-3 text-sm"
                            >
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium">
                                        {transaction.title}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {dateFormatter.format(
                                            new Date(transaction.date),
                                        )}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {transaction.detail}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="py-5 text-center text-sm text-muted-foreground">
                            No transactions found.
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
    onEditVisit,
    onDeleteVisit,
    onAddRecord,
    onEditRecord,
    onDeleteRecord,
}: {
    visit: PatientVisit;
    isLatest: boolean;
    defaultOpen: boolean;
    onEditVisit: () => void;
    onDeleteVisit: () => void;
    onAddRecord: (kind: VisitRecordKind) => void;
    onEditRecord: (kind: VisitRecordKind, record: PatientVisitRecord) => void;
    onDeleteRecord: (kind: VisitRecordKind, record: PatientVisitRecord) => void;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [activeTab, setActiveTab] = useState<VisitRecordKind>('diagnosis');
    const [search, setSearch] = useState('');
    const records = visitRecords(visit, activeTab).filter((record) =>
        visitRecordTitle(record)
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase()),
    );

    return (
        <article className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="px-4 pt-2">
                <div className="flex items-center justify-between border-b">
                    <div className="flex gap-1">
                        <IconAction label="Edit visit" onClick={onEditVisit}>
                            <Pencil className="size-4 text-green-600" />
                        </IconAction>
                        <IconAction
                            label="Delete visit"
                            onClick={onDeleteVisit}
                        >
                            <Trash2 className="size-4 text-red-500" />
                        </IconAction>
                    </div>
                    <IconAction
                        label={open ? 'Collapse visit' : 'Expand visit'}
                        onClick={() => setOpen((value) => !value)}
                    >
                        {open ? (
                            <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                    </IconAction>
                </div>
            </div>

            <button
                type="button"
                className="flex w-full flex-col gap-3 px-4 py-5 text-left sm:flex-row sm:items-center sm:justify-between"
                onClick={() => setOpen((value) => !value)}
            >
                <div className="flex flex-wrap items-center gap-2 font-semibold">
                    {dateFormatter.format(new Date(visit.visited_at))}
                    {isLatest && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            Last visit
                        </span>
                    )}
                    <span className="text-xs font-normal text-muted-foreground">
                        {visit.branch.branch_name}
                        {visit.doctor.name ? ` · ${visit.doctor.name}` : ''}
                    </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                    <span>
                        BP:{' '}
                        <span className="font-normal">
                            {visit.blood_pressure ?? 'N/A'}
                        </span>
                    </span>
                    <span>
                        Weight:{' '}
                        <span className="font-normal">
                            {visit.weight
                                ? `${Number(visit.weight)} kg`
                                : 'N/A'}
                        </span>
                    </span>
                    <span>
                        Height:{' '}
                        <span className="font-normal">
                            {visit.height
                                ? `${Number(visit.height)} cm`
                                : 'N/A'}
                        </span>
                    </span>
                </div>
            </button>

            {open && (
                <div className="border-t px-4 pb-5">
                    <div className="overflow-x-auto border-b">
                        <nav
                            className="flex min-w-max gap-7"
                            aria-label="Visit record tabs"
                        >
                            {(
                                [
                                    'diagnosis',
                                    'prescription',
                                    'service',
                                    'product',
                                ] as VisitRecordKind[]
                            ).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setSearch('');
                                    }}
                                    className={`border-b-2 px-2 py-3 text-sm font-medium capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}
                                >
                                    {tab === 'prescription'
                                        ? 'Prescriptions'
                                        : tab === 'service'
                                          ? 'Services'
                                          : tab === 'product'
                                            ? 'Products'
                                            : 'Diagnosis'}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="grid gap-4 pt-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder={`Search ${activeTab}...`}
                                    className="pl-9"
                                />
                            </div>
                            <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => onAddRecord(activeTab)}
                            >
                                <Plus />{' '}
                                {activeTab === 'prescription'
                                    ? 'Prescription'
                                    : activeTab === 'service'
                                      ? 'Service'
                                      : activeTab === 'product'
                                        ? 'Product'
                                        : 'Diagnosis'}
                            </Button>
                        </div>

                        {records.length > 0 ? (
                            records.map((record) => (
                                <div
                                    key={visitRecordId(record)}
                                    className="rounded-lg border shadow-xs"
                                >
                                    <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                                        <span className="font-semibold">
                                            {visitRecordTitle(record)}
                                        </span>
                                        <div className="flex gap-1">
                                            <IconAction
                                                label="Edit"
                                                onClick={() =>
                                                    onEditRecord(
                                                        activeTab,
                                                        record,
                                                    )
                                                }
                                            >
                                                <Pencil className="size-4 text-green-600" />
                                            </IconAction>
                                            <IconAction
                                                label="Delete"
                                                onClick={() =>
                                                    onDeleteRecord(
                                                        activeTab,
                                                        record,
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-4 text-red-500" />
                                            </IconAction>
                                        </div>
                                    </div>
                                    <div className="grid gap-1 px-3 py-3 text-sm text-muted-foreground">
                                        {visitRecordMeta(record) && (
                                            <p>{visitRecordMeta(record)}</p>
                                        )}
                                        <p>{record.note || 'N/A'}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                                {search
                                    ? 'No matching records found.'
                                    : `No ${activeTab} records found.`}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </article>
    );
}

function IconAction({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            className="rounded-md p-2 hover:bg-muted"
            onClick={onClick}
            aria-label={label}
            title={label}
        >
            {children}
        </button>
    );
}

function InfoRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <p>
            <span className="font-medium">{label}:</span>{' '}
            <span className="text-muted-foreground">{children}</span>
        </p>
    );
}

function summaryRecordId(record: PatientSummaryRecord | null): string | number {
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

function summaryRecordTitle(record: PatientSummaryRecord): string {
    if ('condition' in record) {
        return record.condition;
    }

    if ('allergy' in record) {
        return record.allergy;
    }

    return record.medication;
}

function summaryRecordDetail(record: PatientSummaryRecord): string {
    if ('medication' in record) {
        return [record.dosage, record.frequency, record.duration, record.note]
            .filter(Boolean)
            .join(' · ');
    }

    return record.note ?? '';
}

function visitRecords(
    visit: PatientVisit,
    kind: VisitRecordKind,
): PatientVisitRecord[] {
    if (kind === 'diagnosis') {
        return visit.diagnoses;
    }

    if (kind === 'prescription') {
        return visit.prescriptions;
    }

    if (kind === 'service') {
        return visit.services;
    }

    return visit.products;
}

function visitRecordId(record: PatientVisitRecord | null): string | number {
    if (!record) {
        return 'new';
    }

    if ('diagnosis_ID' in record) {
        return record.diagnosis_ID;
    }

    if ('prescription_ID' in record) {
        return record.prescription_ID;
    }

    if ('visit_service_ID' in record) {
        return record.visit_service_ID;
    }

    return record.visit_product_ID;
}

function visitRecordTitle(record: PatientVisitRecord): string {
    if ('diagnosis' in record) {
        return record.diagnosis;
    }

    if ('prescription' in record) {
        return record.prescription;
    }

    if ('service_name' in record) {
        return record.service_name;
    }

    return record.product_name;
}

function visitRecordMeta(record: PatientVisitRecord): string {
    if ('prescription' in record) {
        return [record.dosage, record.frequency, record.duration]
            .filter(Boolean)
            .join(' · ');
    }

    if ('service_name' in record) {
        return `Quantity: ${record.quantity}`;
    }

    if ('product_name' in record) {
        return [
            `Quantity: ${record.quantity}`,
            record.unit_price
                ? `${currencyFormatter.format(Number(record.unit_price))} each`
                : null,
        ]
            .filter(Boolean)
            .join(' · ');
    }

    return '';
}

function formatDateOnly(value: string): string {
    return dateFormatter.format(new Date(`${value}T00:00:00`));
}

PatientRecordShow.layout = {
    breadcrumbs: [{ title: 'Patient Details', href: index() }],
};
