import { Head, router } from '@inertiajs/react';
import {
    Building2,
    ImageIcon,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import Heading from '@/components/heading';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
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
import { index } from '@/routes/branches';
import type {
    Branch,
    BranchDialogMode,
    BranchFilters,
    BranchPaginator,
} from '@/types';
import { BranchDeleteDialog } from './components/branch-delete-dialog';
import { BranchDialog } from './components/branch-dialog';
import { BranchPagination } from './components/branch-pagination';

type BranchesIndexProps = {
    branches: BranchPaginator;
    filters: BranchFilters;
    totalBranches: number;
};

export default function BranchesIndex({
    branches,
    filters,
    totalBranches,
}: BranchesIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('action') ===
                'create',
    );
    const [dialogMode, setDialogMode] = useState<BranchDialogMode>('create');
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                index.url(),
                {
                    search: search || undefined,
                    per_page: filters.per_page,
                },
                {
                    only: ['branches', 'filters'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters.per_page, filters.search, search]);

    const openBranchDialog = (
        mode: BranchDialogMode,
        branch: Branch | null = null,
    ) => {
        setDialogMode(mode);
        setSelectedBranch(branch);
        setDialogOpen(true);
    };

    const openDeleteDialog = (branch: Branch) => {
        setBranchToDelete(branch);
        setDeleteDialogOpen(true);
    };

    const changePerPage = (value: string) => {
        router.get(
            index.url(),
            {
                search: filters.search || undefined,
                per_page: Number(value),
            },
            {
                only: ['branches', 'filters'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Branches" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Branches"
                        description="Manage clinic locations, contact details, links, and branch images."
                    />
                    <Button onClick={() => openBranchDialog('create')}>
                        <Plus /> Add branch
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="gap-3 py-4">
                        <CardHeader className="flex flex-row items-center justify-between px-4">
                            <span className="text-sm font-medium text-muted-foreground">
                                Total branches
                            </span>
                            <Building2 className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-4">
                            <p className="text-3xl font-semibold">
                                {totalBranches}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search name or location..."
                                className="pl-9"
                                aria-label="Search branches"
                            />
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Rows</span>
                            <Select
                                value={String(filters.per_page)}
                                onValueChange={changePerPage}
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
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-3xl text-sm">
                            <thead className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3">Branch</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {branches.data.map((branch) => (
                                    <ClickableTableRow
                                        key={branch.branch_ID}
                                        accessibleLabel={`View ${branch.branch_name}`}
                                        onActivate={() =>
                                            openBranchDialog('view', branch)
                                        }
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {branch.image_url ? (
                                                    <img
                                                        src={branch.image_url}
                                                        alt=""
                                                        className="size-11 rounded-md border object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-11 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                                                        <ImageIcon className="size-5" />
                                                    </div>
                                                )}
                                                <span className="font-medium">
                                                    {branch.branch_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="max-w-sm px-4 py-3 text-muted-foreground">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="mt-0.5 size-4 shrink-0" />
                                                <span>
                                                    {branch.branch_location}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            {branch.contact_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <TooltipIconButton
                                                    variant="ghost"
                                                    size="icon"
                                                    tooltip={`Edit ${branch.branch_name}`}
                                                    onClick={() =>
                                                        openBranchDialog(
                                                            'edit',
                                                            branch,
                                                        )
                                                    }
                                                    aria-label={`Edit ${branch.branch_name}`}
                                                >
                                                    <Pencil />
                                                </TooltipIconButton>
                                                <TooltipIconButton
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    tooltip={`Delete ${branch.branch_name}`}
                                                    onClick={() =>
                                                        openDeleteDialog(branch)
                                                    }
                                                    aria-label={`Delete ${branch.branch_name}`}
                                                >
                                                    <Trash2 />
                                                </TooltipIconButton>
                                            </div>
                                        </td>
                                    </ClickableTableRow>
                                ))}
                            </tbody>
                        </table>

                        {branches.data.length === 0 && (
                            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                                <Building2 className="size-10 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        No branches found
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {filters.search
                                            ? 'Try a different search term.'
                                            : 'Add the first clinic branch to get started.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <BranchPagination branches={branches} filters={filters} />
                </Card>
            </div>

            <BranchDialog
                key={`${dialogMode}-${selectedBranch?.branch_ID ?? 'new'}`}
                branch={selectedBranch}
                mode={dialogMode}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <BranchDeleteDialog
                branch={branchToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

BranchesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Branches',
            href: index(),
        },
    ],
};
