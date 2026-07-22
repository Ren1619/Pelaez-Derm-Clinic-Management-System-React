import { Head, router } from '@inertiajs/react';
import {
    CircleCheckBig,
    MailWarning,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import {
    DataTableLayout,
    DataTableToolbar,
} from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index, show } from '@/routes/patients';
import type {
    Patient,
    PatientDialogMode,
    PatientFilters,
    PatientPaginator,
    PatientSummary,
} from '@/types';
import { PatientDeleteDialog } from './components/patient-delete-dialog';
import { PatientDialog } from './components/patient-dialog';

type PatientsIndexProps = {
    patients: PatientPaginator;
    filters: PatientFilters;
    summary: PatientSummary;
};

export default function PatientsIndex({
    patients,
    filters,
    summary,
}: PatientsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<PatientDialogMode>('create');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
        null,
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [patientToDelete, setPatientToDelete] = useState<Patient | null>(
        null,
    );

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                index.url(),
                {
                    search: search || undefined,
                    verification: filters.verification ?? undefined,
                    per_page: filters.per_page,
                },
                {
                    only: ['patients', 'filters'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters.per_page, filters.search, filters.verification, search]);

    const visitWithFilters = (
        changes: Partial<PatientFilters>,
        only: string[] = ['patients', 'filters'],
    ) => {
        const nextFilters = { ...filters, ...changes };

        router.get(
            index.url(),
            {
                search: nextFilters.search || undefined,
                verification: nextFilters.verification ?? undefined,
                per_page: nextFilters.per_page,
            },
            {
                only,
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openPatientDialog = (
        mode: PatientDialogMode,
        patient: Patient | null = null,
    ) => {
        setDialogMode(mode);
        setSelectedPatient(patient);
        setDialogOpen(true);
    };

    const openDeleteDialog = (patient: Patient) => {
        setPatientToDelete(patient);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Patients" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Patient management"
                        description="Manage patient identity, contact details, and email verification."
                    />
                    <Button onClick={() => openPatientDialog('create')}>
                        <Plus /> Add patient
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        label="Total patients"
                        value={summary.total}
                        icon={<UserRound className="size-4" />}
                    />
                    <SummaryCard
                        label="Verified"
                        value={summary.verified}
                        icon={<CircleCheckBig className="size-4" />}
                    />
                    <SummaryCard
                        label="Awaiting verification"
                        value={summary.unverified}
                        icon={<MailWarning className="size-4" />}
                    />
                </div>

                <DataTableLayout
                    toolbar={
                        <DataTableToolbar className="grid sm:grid-cols-[minmax(14rem,1fr)_minmax(11rem,auto)] lg:grid">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search patients..."
                                    className="pl-9"
                                    aria-label="Search patients"
                                />
                            </div>

                            <Select
                                value={filters.verification ?? 'all'}
                                onValueChange={(value) =>
                                    visitWithFilters({
                                        verification:
                                            value === 'all'
                                                ? null
                                                : (value as
                                                      | 'verified'
                                                      | 'unverified'),
                                    })
                                }
                            >
                                <SelectTrigger aria-label="Verification status">
                                    <SelectValue placeholder="All verification" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All verification
                                    </SelectItem>
                                    <SelectItem value="verified">
                                        Verified
                                    </SelectItem>
                                    <SelectItem value="unverified">
                                        Unverified
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </DataTableToolbar>
                    }
                    footer={
                        <DataTablePagination
                            paginator={patients}
                            itemLabel="patients"
                            onPageChange={(page) =>
                                router.get(
                                    index.url(),
                                    { ...filters, page },
                                    {
                                        only: ['patients', 'filters'],
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
                            onPerPageChange={(perPage) =>
                                visitWithFilters({ per_page: perPage })
                            }
                        />
                    }
                >
                    <Table className="min-w-5xl">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Demographics</TableHead>
                                <TableHead>Last visit</TableHead>
                                <TableHead>Verification</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.data.map((patient) => (
                                <ClickableTableRow
                                    key={patient.PID}
                                    accessibleLabel={`View ${patient.full_name}`}
                                    activationRole="link"
                                    onActivate={() =>
                                        router.visit(show(patient).url)
                                    }
                                >
                                    <TableCell>
                                        <div className="font-medium">
                                            {patient.last_name},{' '}
                                            {patient.first_name}{' '}
                                            {patient.middle_name ?? ''}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Patient #{patient.PID}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href={`mailto:${patient.email}`}
                                            className="block hover:underline"
                                        >
                                            {patient.email}
                                        </a>
                                        <a
                                            href={`tel:${patient.contact_number}`}
                                            className="text-xs text-muted-foreground hover:underline"
                                        >
                                            {patient.contact_number}
                                        </a>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {patient.sex}, {patient.age} years old
                                        <p className="text-xs">
                                            {patient.civil_status}
                                        </p>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {patient.last_visit_at ? (
                                            <time
                                                dateTime={patient.last_visit_at}
                                            >
                                                {new Intl.DateTimeFormat(
                                                    'en-PH',
                                                    { dateStyle: 'medium' },
                                                ).format(
                                                    new Date(
                                                        patient.last_visit_at,
                                                    ),
                                                )}
                                            </time>
                                        ) : (
                                            'No visits yet'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                patient.email_verified_at
                                                    ? 'outline'
                                                    : 'secondary'
                                            }
                                        >
                                            {patient.email_verified_at
                                                ? 'Verified'
                                                : 'Unverified'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                tooltip={`Edit ${patient.full_name}`}
                                                onClick={() =>
                                                    openPatientDialog(
                                                        'edit',
                                                        patient,
                                                    )
                                                }
                                                aria-label={`Edit ${patient.full_name}`}
                                            >
                                                <Pencil />
                                            </TooltipIconButton>
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                tooltip={`Delete ${patient.full_name}`}
                                                onClick={() =>
                                                    openDeleteDialog(patient)
                                                }
                                                aria-label={`Delete ${patient.full_name}`}
                                            >
                                                <Trash2 />
                                            </TooltipIconButton>
                                        </div>
                                    </TableCell>
                                </ClickableTableRow>
                            ))}
                            {patients.data.length === 0 && (
                                <DataTableEmptyState
                                    colSpan={6}
                                    icon={
                                        <UserRound className="size-10 text-muted-foreground" />
                                    }
                                    title="No patients found"
                                    description="Try changing the search or verification filter."
                                />
                            )}
                        </TableBody>
                    </Table>
                </DataTableLayout>
            </div>

            <PatientDialog
                key={`${dialogMode}-${selectedPatient?.PID ?? 'new'}`}
                patient={selectedPatient}
                mode={dialogMode}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <PatientDeleteDialog
                patient={patientToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

function SummaryCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: ReactNode;
}) {
    return (
        <Card className="gap-3 py-4">
            <CardHeader className="flex flex-row items-center justify-between px-4 text-muted-foreground">
                <span className="text-sm font-medium">{label}</span>
                {icon}
            </CardHeader>
            <CardContent className="px-4">
                <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

PatientsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Patients',
            href: index(),
        },
    ],
};
