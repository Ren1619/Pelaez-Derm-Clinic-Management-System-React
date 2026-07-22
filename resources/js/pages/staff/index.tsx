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
import { StaffPagination } from './components/staff-pagination';
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

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="grid gap-3 border-b p-4 lg:grid-cols-[minmax(14rem,1fr)_repeat(4,minmax(9rem,auto))]">
                        <div className="relative">
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
                                        value === 'all' ? null : Number(value),
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
                                        value === 'all' ? null : Number(value),
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
                                                  'verified' | 'unverified'),
                                })
                            }
                            options={[
                                { value: 'verified', label: 'Verified' },
                                { value: 'unverified', label: 'Unverified' },
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
                                            : (value as 'active' | 'inactive'),
                                })
                            }
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 border-b px-4 py-3 text-sm text-muted-foreground">
                        <span>Rows</span>
                        <Select
                            value={String(filters.per_page)}
                            onValueChange={(value) =>
                                visitWithFilters({ per_page: Number(value) })
                            }
                        >
                            <SelectTrigger
                                className="w-20"
                                aria-label="Rows per page"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-5xl text-sm">
                            <thead className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3">Staff member</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Branch</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Verification</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {staffAccounts.data.map((staffAccount) => (
                                    <ClickableTableRow
                                        key={staffAccount.account_ID}
                                        accessibleLabel={`View ${staffAccount.full_name}`}
                                        onActivate={() =>
                                            openStaffDialog(
                                                'view',
                                                staffAccount,
                                            )
                                        }
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {staffAccount.last_name},{' '}
                                                {staffAccount.first_name}{' '}
                                                {staffAccount.middle_name ?? ''}
                                            </div>
                                            <a
                                                href={`mailto:${staffAccount.email}`}
                                                className="text-xs text-muted-foreground hover:underline"
                                            >
                                                {staffAccount.email}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3">
                                            {roleLabels[
                                                staffAccount.role.role_name
                                            ] ?? staffAccount.role.role_name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {staffAccount.branch?.branch_name ??
                                                'All branches'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            <a
                                                href={`tel:${staffAccount.contact_number}`}
                                                className="hover:underline"
                                            >
                                                {staffAccount.contact_number}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3">
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
                                        </td>
                                        <td className="px-4 py-3">
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
                                        </td>
                                        <td className="px-4 py-3">
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
                                        </td>
                                    </ClickableTableRow>
                                ))}
                            </tbody>
                        </table>

                        {staffAccounts.data.length === 0 && (
                            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                                <Users className="size-10 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        No staff members found
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Try changing the search or filters.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <StaffPagination
                        staffAccounts={staffAccounts}
                        filters={filters}
                    />
                </Card>
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
            <SelectTrigger aria-label={placeholder}>
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
