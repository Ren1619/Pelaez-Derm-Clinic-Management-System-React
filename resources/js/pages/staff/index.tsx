import { Head, router } from '@inertiajs/react';
import {
    CircleCheckBig,
    MailWarning,
    Pencil,
    Plus,
    Power,
    PowerOff,
    Search,
    Users,
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
import {
    markNewRecordSeen,
    NewRecordBadge,
    newRecordRowClass,
} from '@/components/new-record-indicator';
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
import { index } from '@/routes/staff';
import type {
    AccountRole,
    StaffAccount,
    StaffBranchOption,
    StaffDialogMode,
    StaffFilters,
    StaffPaginator,
    StaffSummary,
} from '@/types';
import { StaffDialog } from './components/staff-dialog';
import { StaffStatusDialog } from './components/staff-status-dialog';

type StaffIndexProps = {
    staffAccounts: StaffPaginator;
    filters: StaffFilters;
    branches: StaffBranchOption[];
    roles: AccountRole[];
    summary: StaffSummary;
};

const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    staff: 'Staff',
    doctor: 'Doctor',
};

export default function StaffIndex({
    staffAccounts,
    filters,
    branches,
    roles,
    summary,
}: StaffIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('action') ===
                'create',
    );
    const [dialogMode, setDialogMode] = useState<StaffDialogMode>('create');
    const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(
        null,
    );
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [statusStaff, setStatusStaff] = useState<StaffAccount | null>(null);

    const visitWithFilters = (nextFilters: Partial<StaffFilters>) => {
        const next = { ...filters, ...nextFilters };

        router.get(
            index.url(),
            {
                search: next.search || undefined,
                branch_ID: next.branch_ID ?? undefined,
                role_ID: next.role_ID ?? undefined,
                verification: next.verification ?? undefined,
                status: next.status ?? undefined,
                per_page: next.per_page,
            },
            {
                only: ['staffAccounts', 'filters'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            visitWithFilters({ search });
        }, 350);

        return () => window.clearTimeout(timeout);
        // The current server-side filters intentionally define the next visit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters.search]);

    const openStaffDialog = (
        mode: StaffDialogMode,
        staffAccount: StaffAccount | null = null,
    ) => {
        if (mode === 'view' && staffAccount !== null) {
            markNewRecordSeen(staffAccount, 'staff');
        }

        setDialogMode(mode);
        setSelectedStaff(staffAccount);
        setDialogOpen(true);
    };

    const openStatusDialog = (staffAccount: StaffAccount) => {
        setStatusStaff(staffAccount);
        setStatusDialogOpen(true);
    };

    return (
        <>
            <Head title="Staff" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Staff management"
                        description="Manage clinic staff assignments, roles, verification, and account access."
                    />
                    <Button onClick={() => openStaffDialog('create')}>
                        <Plus /> Add staff
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        label="Total staff"
                        value={summary.total}
                        icon={<Users className="size-4" />}
                    />
                    <SummaryCard
                        label="Active accounts"
                        value={summary.active}
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
                        <DataTableToolbar className="flex-wrap">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search staff..."
                                    className="pl-9"
                                    aria-label="Search staff"
                                />
                            </div>

                            <FilterSelect
                                value={filters.branch_ID?.toString() ?? 'all'}
                                placeholder="All branches"
                                onValueChange={(value) =>
                                    visitWithFilters({
                                        branch_ID:
                                            value === 'all'
                                                ? null
                                                : Number(value),
                                    })
                                }
                                options={branches.map((branch) => ({
                                    value: String(branch.branch_ID),
                                    label: branch.branch_name,
                                }))}
                            />
                            <FilterSelect
                                value={filters.role_ID?.toString() ?? 'all'}
                                placeholder="All roles"
                                onValueChange={(value) =>
                                    visitWithFilters({
                                        role_ID:
                                            value === 'all'
                                                ? null
                                                : Number(value),
                                    })
                                }
                                options={roles.map((role) => ({
                                    value: String(role.role_ID),
                                    label:
                                        roleLabels[role.role_name] ??
                                        role.role_name,
                                }))}
                            />
                            <FilterSelect
                                value={filters.verification ?? 'all'}
                                placeholder="All verification"
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
                                options={[
                                    { value: 'verified', label: 'Verified' },
                                    {
                                        value: 'unverified',
                                        label: 'Unverified',
                                    },
                                ]}
                            />
                            <FilterSelect
                                value={filters.status ?? 'all'}
                                placeholder="All statuses"
                                onValueChange={(value) =>
                                    visitWithFilters({
                                        status:
                                            value === 'all'
                                                ? null
                                                : (value as
                                                      'active' | 'inactive'),
                                    })
                                }
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ]}
                            />
                        </DataTableToolbar>
                    }
                    footer={
                        <DataTablePagination
                            paginator={staffAccounts}
                            itemLabel="staff members"
                            onPageChange={(page) =>
                                router.get(
                                    index.url(),
                                    { ...filters, page },
                                    {
                                        only: ['staffAccounts', 'filters'],
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
                                <TableHead>Staff member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Verification</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffAccounts.data.map((staffAccount) => (
                                <ClickableTableRow
                                    key={staffAccount.account_ID}
                                    accessibleLabel={`View ${staffAccount.full_name}`}
                                    onActivate={() =>
                                        openStaffDialog('view', staffAccount)
                                    }
                                    className={newRecordRowClass(staffAccount)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {staffAccount.last_name},{' '}
                                                {staffAccount.first_name}{' '}
                                                {staffAccount.middle_name ?? ''}
                                            </span>
                                            {staffAccount.is_new && (
                                                <NewRecordBadge />
                                            )}
                                        </div>
                                        <a
                                            href={`mailto:${staffAccount.email}`}
                                            className="text-xs text-muted-foreground hover:underline"
                                        >
                                            {staffAccount.email}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        {roleLabels[
                                            staffAccount.role.role_name
                                        ] ?? staffAccount.role.role_name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {staffAccount.branch?.branch_name ??
                                            'All branches'}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        <a
                                            href={`tel:${staffAccount.contact_number}`}
                                            className="hover:underline"
                                        >
                                            {staffAccount.contact_number}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                staffAccount.email_verified_at
                                                    ? 'outline'
                                                    : 'secondary'
                                            }
                                        >
                                            {staffAccount.email_verified_at
                                                ? 'Verified'
                                                : 'Unverified'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                staffAccount.is_active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {staffAccount.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                tooltip={`Edit ${staffAccount.full_name}`}
                                                onClick={() =>
                                                    openStaffDialog(
                                                        'edit',
                                                        staffAccount,
                                                    )
                                                }
                                                aria-label={`Edit ${staffAccount.full_name}`}
                                            >
                                                <Pencil />
                                            </TooltipIconButton>
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                className={
                                                    staffAccount.is_active
                                                        ? 'text-destructive hover:text-destructive'
                                                        : 'text-emerald-600 hover:text-emerald-600'
                                                }
                                                tooltip={`${staffAccount.is_active ? 'Disable' : 'Enable'} ${staffAccount.full_name}`}
                                                onClick={() =>
                                                    openStatusDialog(
                                                        staffAccount,
                                                    )
                                                }
                                                aria-label={`${staffAccount.is_active ? 'Disable' : 'Enable'} ${staffAccount.full_name}`}
                                            >
                                                {staffAccount.is_active ? (
                                                    <PowerOff />
                                                ) : (
                                                    <Power />
                                                )}
                                            </TooltipIconButton>
                                        </div>
                                    </TableCell>
                                </ClickableTableRow>
                            ))}
                            {staffAccounts.data.length === 0 && (
                                <DataTableEmptyState
                                    colSpan={7}
                                    icon={
                                        <Users className="size-10 text-muted-foreground" />
                                    }
                                    title="No staff members found"
                                    description="Try changing the search or filters."
                                />
                            )}
                        </TableBody>
                    </Table>
                </DataTableLayout>
            </div>

            <StaffDialog
                key={`${dialogMode}-${selectedStaff?.account_ID ?? 'new'}`}
                staffAccount={selectedStaff}
                branches={branches}
                roles={roles}
                mode={dialogMode}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
            <StaffStatusDialog
                key={statusStaff?.account_ID ?? 'none'}
                staffAccount={statusStaff}
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
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

function FilterSelect({
    value,
    placeholder,
    options,
    onValueChange,
}: {
    value: string;
    placeholder: string;
    options: Array<{ value: string; label: string }>;
    onValueChange: (value: string) => void;
}) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-full sm:w-44" aria-label={placeholder}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{placeholder}</SelectItem>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

StaffIndex.layout = {
    breadcrumbs: [
        {
            title: 'Staff',
            href: index(),
        },
    ],
};
