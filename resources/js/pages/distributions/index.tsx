import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    CalendarIcon,
    PackageCheck,
    Plus,
    Search,
    Send,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import { DataTableLayout } from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import {
    markNewRecordSeen,
    NewRecordBadge,
    newRecordRowClass,
} from '@/components/new-record-indicator';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    cancel,
    destroy,
    index,
    receive,
    send,
    store,
} from '@/routes/distributions';
import type {
    Distribution,
    DistributionBranch,
    DistributionFilters,
    DistributionPaginator,
    DistributionProduct,
    DistributionStatus,
} from '@/types';

type DistributionIndexProps = {
    distributions: DistributionPaginator;
    filters: DistributionFilters;
    counts: {
        outbound: number;
        inbound: number;
        pending_outbound: number;
        pending_inbound: number;
    };
    branches: DistributionBranch[];
    availableProducts: DistributionProduct[];
    canCreate: boolean;
    canViewAllBranches: boolean;
    currentBranchId: number | null;
};

type CreateDistributionForm = {
    from_branch_ID: string;
    to_branch_ID: string;
    scheduled_date: string;
    notes: string;
    items: Array<{ product_ID: number; quantity: number }>;
};

const statusLabels: Record<DistributionStatus, string> = {
    pending: 'Scheduled',
    in_transit: 'In transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const statusVariants: Record<
    DistributionStatus,
    'default' | 'secondary' | 'outline' | 'destructive'
> = {
    pending: 'secondary',
    in_transit: 'default',
    delivered: 'outline',
    cancelled: 'destructive',
};

const formatDate = (value: string | null, includeTime = false) => {
    if (!value) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        ...(includeTime ? { timeStyle: 'short' as const } : {}),
    }).format(new Date(value));
};

/** Converts a local date and time into the value expected by Laravel. */
function formatScheduledDate(date: Date, time: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}T${time}`;
}

/** Displays a Shadcn calendar with a time field for delivery scheduling. */
function ScheduledDeliveryDateInput({
    value,
    onChange,
    invalid,
}: {
    value: string;
    onChange: (value: string) => void;
    invalid: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [datePart, timePart = '09:00'] = value.split('T');
    const [draftTime, setDraftTime] = useState('09:00');
    const selectedTime = datePart ? timePart : draftTime;
    const selectedDate = datePart
        ? new Date(`${datePart}T00:00:00`)
        : undefined;
    const today = new Date();
    const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );
    const displayValue = selectedDate
        ? new Intl.DateTimeFormat('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
          }).format(
              new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  selectedDate.getDate(),
                  Number(selectedTime.split(':')[0]),
                  Number(selectedTime.split(':')[1]),
              ),
          )
        : '';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id="scheduled-date"
                    type="button"
                    variant="outline"
                    aria-invalid={invalid}
                    className="w-full justify-between font-normal aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                >
                    <span
                        className={displayValue ? '' : 'text-muted-foreground'}
                    >
                        {displayValue || 'July 10, 2026 at 5:24 PM'}
                    </span>
                    <CalendarIcon className="size-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        if (date) {
                            onChange(formatScheduledDate(date, selectedTime));
                        }
                    }}
                    disabled={{ before: startOfToday }}
                    captionLayout="dropdown"
                    startMonth={startOfToday}
                    endMonth={new Date(today.getFullYear() + 10, 11)}
                />
                <div className="grid gap-2 border-t p-3">
                    <Label htmlFor="scheduled-time">Delivery time</Label>
                    <Input
                        id="scheduled-time"
                        type="time"
                        value={selectedTime}
                        onChange={(event) => {
                            const nextTime = event.target.value;

                            setDraftTime(nextTime);

                            if (selectedDate && nextTime) {
                                onChange(
                                    formatScheduledDate(selectedDate, nextTime),
                                );
                            }
                        }}
                    />
                    <Button type="button" onClick={() => setOpen(false)}>
                        Done
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function DistributionIndex({
    distributions,
    filters,
    counts,
    branches,
    availableProducts,
    canCreate,
    canViewAllBranches,
    currentBranchId,
}: DistributionIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [details, setDetails] = useState<Distribution | null>(null);
    const [distributionToSend, setDistributionToSend] =
        useState<Distribution | null>(null);
    const [sending, setSending] = useState(false);
    const [distributionToCancel, setDistributionToCancel] =
        useState<Distribution | null>(null);
    const [selectedItems, setSelectedItems] = useState<
        Record<number, number | ''>
    >({});
    const [productSearch, setProductSearch] = useState('');
    const page = usePage();
    const pageErrors = page.props.errors as Record<string, string>;
    const initialSourceBranch =
        currentBranchId?.toString() ?? branches[0]?.branch_ID.toString() ?? '';
    const createForm = useForm<CreateDistributionForm>({
        from_branch_ID: initialSourceBranch,
        to_branch_ID: '',
        scheduled_date: '',
        notes: '',
        items: [],
    });
    const cancelForm = useForm({ cancellation_reason: '' });

    const sourceProducts = useMemo(
        () =>
            availableProducts.filter(
                (product) =>
                    product.branch_ID ===
                    Number(createForm.data.from_branch_ID),
            ),
        [availableProducts, createForm.data.from_branch_ID],
    );
    const filteredSourceProducts = useMemo(() => {
        const query = productSearch.trim().toLowerCase();

        if (!query) {
            return sourceProducts;
        }

        return sourceProducts.filter((product) =>
            [
                product.name,
                product.category_name,
                product.measurement_unit,
            ].some((value) => value.toLowerCase().includes(query)),
        );
    }, [productSearch, sourceProducts]);
    const selectedProducts = useMemo(
        () =>
            sourceProducts.filter(
                (product) => selectedItems[product.product_ID] !== undefined,
            ),
        [selectedItems, sourceProducts],
    );
    const hasInvalidQuantities = Object.values(selectedItems).some(
        (quantity) => quantity === '' || quantity < 1,
    );

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                index.url(),
                {
                    tab: filters.tab,
                    search: search || undefined,
                    branch_ID: filters.branch_ID ?? undefined,
                    per_page: filters.per_page,
                },
                {
                    only: ['distributions', 'filters', 'counts'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [
        filters.branch_ID,
        filters.per_page,
        filters.search,
        filters.tab,
        search,
    ]);

    const visitDistributions = (
        changes: Partial<DistributionFilters>,
        replace = true,
    ) => {
        const next = { ...filters, ...changes };

        router.get(
            index.url(),
            {
                tab: next.tab,
                search: next.search || undefined,
                branch_ID: next.branch_ID ?? undefined,
                per_page: next.per_page,
            },
            {
                only: ['distributions', 'filters', 'counts'],
                preserveState: true,
                preserveScroll: true,
                replace,
            },
        );
    };

    const submitDistribution = (event: React.FormEvent) => {
        event.preventDefault();
        createForm.transform((data) => ({
            ...data,
            from_branch_ID: Number(data.from_branch_ID),
            to_branch_ID: Number(data.to_branch_ID),
            scheduled_date: data.scheduled_date || null,
            notes: data.notes || null,
            items: Object.entries(selectedItems).map(
                ([productId, quantity]) => ({
                    product_ID: Number(productId),
                    quantity: Number(quantity),
                }),
            ),
        }));
        createForm.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                setSelectedItems({});
                setProductSearch('');
                createForm.reset();
                createForm.setData('from_branch_ID', initialSourceBranch);
            },
        });
    };

    const submitCancellation = (event: React.FormEvent) => {
        event.preventDefault();

        if (!distributionToCancel) {
            return;
        }

        cancelForm.patch(cancel.url(distributionToCancel.distribution_ID), {
            preserveScroll: true,
            onSuccess: () => {
                setDistributionToCancel(null);
                cancelForm.reset();
            },
        });
    };

    const confirmSend = () => {
        if (!distributionToSend) {
            return;
        }

        setSending(true);
        router.patch(
            send.url(distributionToSend.distribution_ID),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setDistributionToSend(null),
                onFinish: () => setSending(false),
            },
        );
    };

    const changeSourceBranch = (value: string) => {
        createForm.setData('from_branch_ID', value);
        createForm.setData('to_branch_ID', '');
        setSelectedItems({});
        setProductSearch('');
    };

    const toggleProduct = (product: DistributionProduct, checked: boolean) => {
        setSelectedItems((current) => {
            const next = { ...current };

            if (checked) {
                next[product.product_ID] = 1;
            } else {
                delete next[product.product_ID];
            }

            return next;
        });
    };

    const updateQuantity = (product: DistributionProduct, quantity: string) => {
        setSelectedItems((current) => ({
            ...current,
            [product.product_ID]:
                quantity === ''
                    ? ''
                    : Math.min(product.quantity, Math.max(0, Number(quantity))),
        }));
    };

    return (
        <>
            <Head title="Distribution" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Distribution"
                        description="Schedule, send, and receive product stock between clinic branches."
                    />
                    {canCreate && (
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus /> Create distribution
                        </Button>
                    )}
                </div>

                {pageErrors.distribution && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            {pageErrors.distribution}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Outbound distributions
                                </p>
                                <p className="text-2xl font-semibold">
                                    {counts.outbound}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {counts.pending_outbound} active
                                </p>
                            </div>
                            <ArrowUpFromLine className="size-8 text-muted-foreground" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Inbound distributions
                                </p>
                                <p className="text-2xl font-semibold">
                                    {counts.inbound}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {counts.pending_inbound} awaiting receipt
                                </p>
                            </div>
                            <ArrowDownToLine className="size-8 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>

                <DataTableLayout>
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-start">
                        <div className="flex gap-1 rounded-lg bg-muted p-1">
                            {(['outbound', 'inbound'] as const).map((tab) => (
                                <Button
                                    key={tab}
                                    size="sm"
                                    variant={
                                        filters.tab === tab
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    onClick={() =>
                                        visitDistributions({ tab }, false)
                                    }
                                >
                                    {tab === 'outbound'
                                        ? 'Outbound'
                                        : 'Inbound'}
                                    {tab === 'outbound' &&
                                        counts.pending_outbound > 0 && (
                                            <Badge variant="secondary">
                                                {counts.pending_outbound}
                                            </Badge>
                                        )}
                                    {tab === 'inbound' &&
                                        counts.pending_inbound > 0 && (
                                            <Badge variant="secondary">
                                                {counts.pending_inbound}
                                            </Badge>
                                        )}
                                </Button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative sm:w-72">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search ID or branch..."
                                    className="pl-9"
                                />
                            </div>
                            {canViewAllBranches && (
                                <Select
                                    value={
                                        filters.branch_ID?.toString() ?? 'all'
                                    }
                                    onValueChange={(value) =>
                                        visitDistributions({
                                            branch_ID:
                                                value === 'all'
                                                    ? null
                                                    : Number(value),
                                        })
                                    }
                                >
                                    <SelectTrigger className="sm:w-48">
                                        <SelectValue placeholder="All branches" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All branches
                                        </SelectItem>
                                        {branches.map((branch) => (
                                            <SelectItem
                                                key={branch.branch_ID}
                                                value={branch.branch_ID.toString()}
                                            >
                                                {branch.branch_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <Table className="min-w-4xl">
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>
                                    {filters.tab === 'outbound'
                                        ? 'Destination'
                                        : 'Source'}
                                </TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Scheduled</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {distributions.data.map((distribution) => (
                                <ClickableTableRow
                                    key={distribution.distribution_ID}
                                    accessibleLabel={`View distribution ${distribution.distribution_ID}`}
                                    onActivate={() => {
                                        markNewRecordSeen(
                                            distribution,
                                            'distribution',
                                        );
                                        setDetails(distribution);
                                    }}
                                    className={newRecordRowClass(distribution)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            #{distribution.distribution_ID}
                                            {distribution.is_new && (
                                                <NewRecordBadge />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {filters.tab === 'outbound'
                                            ? distribution.to_branch.branch_name
                                            : distribution.from_branch
                                                  .branch_name}
                                    </TableCell>
                                    <TableCell>
                                        {distribution.items.length} product
                                        {distribution.items.length === 1
                                            ? ''
                                            : 's'}
                                        <span className="block text-xs text-muted-foreground">
                                            {distribution.total_quantity} total
                                            units
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(
                                            distribution.scheduled_date ??
                                                distribution.created_at,
                                            true,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                statusVariants[
                                                    distribution.status
                                                ]
                                            }
                                        >
                                            {statusLabels[distribution.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DistributionActions
                                            distribution={distribution}
                                            onSend={() =>
                                                setDistributionToSend(
                                                    distribution,
                                                )
                                            }
                                            onCancel={() => {
                                                cancelForm.reset();
                                                setDistributionToCancel(
                                                    distribution,
                                                );
                                            }}
                                        />
                                    </TableCell>
                                </ClickableTableRow>
                            ))}
                            {distributions.data.length === 0 && (
                                <DataTableEmptyState
                                    colSpan={6}
                                    title={`No ${filters.tab} distributions found`}
                                    description="Try changing the current search or filters."
                                />
                            )}
                        </TableBody>
                    </Table>

                    <DataTablePagination
                        paginator={distributions}
                        itemLabel="distributions"
                        onPageChange={(page) =>
                            router.get(
                                index.url(),
                                { ...filters, page },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                },
                            )
                        }
                        onPerPageChange={(perPage) =>
                            visitDistributions({ per_page: perPage })
                        }
                    />
                </DataTableLayout>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[95dvh] overflow-y-auto sm:max-w-6xl">
                    <form onSubmit={submitDistribution} className="grid gap-5">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ArrowUpFromLine className="size-5" />
                                Create distribution
                            </DialogTitle>
                            <DialogDescription>
                                All fields with{' '}
                                <span
                                    className="text-primary"
                                    aria-hidden="true"
                                >
                                    *
                                </span>{' '}
                                are required.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)] gap-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="from-branch">
                                            Source branch
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={
                                                createForm.data.from_branch_ID
                                            }
                                            onValueChange={changeSourceBranch}
                                            disabled={!canViewAllBranches}
                                        >
                                            <SelectTrigger
                                                id="from-branch"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Select source" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((branch) => (
                                                    <SelectItem
                                                        key={branch.branch_ID}
                                                        value={branch.branch_ID.toString()}
                                                    >
                                                        {branch.branch_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError
                                            message={
                                                createForm.errors.from_branch_ID
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="to-branch">
                                            Destination branch
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={createForm.data.to_branch_ID}
                                            onValueChange={(value) =>
                                                createForm.setData(
                                                    'to_branch_ID',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="to-branch"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Select destination" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches
                                                    .filter(
                                                        (branch) =>
                                                            branch.branch_ID !==
                                                            Number(
                                                                createForm.data
                                                                    .from_branch_ID,
                                                            ),
                                                    )
                                                    .map((branch) => (
                                                        <SelectItem
                                                            key={
                                                                branch.branch_ID
                                                            }
                                                            value={branch.branch_ID.toString()}
                                                        >
                                                            {branch.branch_name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError
                                            message={
                                                createForm.errors.to_branch_ID
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="scheduled-date">
                                        Scheduled delivery date
                                    </Label>
                                    <ScheduledDeliveryDateInput
                                        value={createForm.data.scheduled_date}
                                        onChange={(value) =>
                                            createForm.setData(
                                                'scheduled_date',
                                                value,
                                            )
                                        }
                                        invalid={Boolean(
                                            createForm.errors.scheduled_date,
                                        )}
                                    />
                                    <FieldError
                                        message={
                                            createForm.errors.scheduled_date
                                        }
                                    />
                                </div>
                                <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <textarea
                                        id="notes"
                                        value={createForm.data.notes}
                                        onChange={(event) =>
                                            createForm.setData(
                                                'notes',
                                                event.target.value,
                                            )
                                        }
                                        maxLength={500}
                                        placeholder="Add any notes or special instructions..."
                                        className="h-full min-h-32 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                    />
                                    <FieldError
                                        message={createForm.errors.notes}
                                    />
                                </div>
                            </div>

                            <div className="grid min-w-0 content-start gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="distribution-product-search">
                                        Select products
                                        <span
                                            className="text-primary"
                                            aria-hidden="true"
                                        >
                                            *
                                        </span>
                                    </Label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="distribution-product-search"
                                            type="search"
                                            value={productSearch}
                                            onChange={(event) =>
                                                setProductSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Search products..."
                                            className="pl-9"
                                        />
                                    </div>
                                    <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
                                        {filteredSourceProducts.map(
                                            (product) => {
                                                const checked =
                                                    selectedItems[
                                                        product.product_ID
                                                    ] !== undefined;

                                                return (
                                                    <div
                                                        key={product.product_ID}
                                                        className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                                                        onClick={() =>
                                                            toggleProduct(
                                                                product,
                                                                !checked,
                                                            )
                                                        }
                                                    >
                                                        <Checkbox
                                                            checked={checked}
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                            onCheckedChange={(
                                                                value,
                                                            ) =>
                                                                toggleProduct(
                                                                    product,
                                                                    value ===
                                                                        true,
                                                                )
                                                            }
                                                            aria-label={`Select ${product.name}`}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm">
                                                                {product.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    product.category_name
                                                                }{' '}
                                                                · Expires{' '}
                                                                {product.expiration_date ??
                                                                    'N/A'}{' '}
                                                                ·{' '}
                                                                {
                                                                    product.quantity
                                                                }{' '}
                                                                {
                                                                    product.measurement_unit
                                                                }{' '}
                                                                available
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline">
                                                            {product.quantity}{' '}
                                                            {
                                                                product.measurement_unit
                                                            }
                                                        </Badge>
                                                    </div>
                                                );
                                            },
                                        )}
                                        {filteredSourceProducts.length ===
                                            0 && (
                                            <p className="p-6 text-center text-sm text-muted-foreground">
                                                {sourceProducts.length === 0
                                                    ? 'No distributable stock is available at this branch.'
                                                    : 'No products match your search.'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid min-w-0 gap-2">
                                    <Label>
                                        Selected products (
                                        {selectedProducts.length})
                                    </Label>
                                    <div className="max-h-64 overflow-auto rounded-md border">
                                        <table className="w-full min-w-[640px] text-sm">
                                            <thead className="sticky top-0 z-10 border-b bg-muted/90 text-left backdrop-blur-sm">
                                                <tr>
                                                    <th className="px-3 py-2 font-medium">
                                                        Product
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Expiry
                                                    </th>
                                                    <th className="px-3 py-2 text-right font-medium">
                                                        Available
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Quantity
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Unit
                                                    </th>
                                                    <th className="px-3 py-2 text-center font-medium">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {selectedProducts.map(
                                                    (product) => (
                                                        <tr
                                                            key={
                                                                product.product_ID
                                                            }
                                                        >
                                                            <td className="max-w-44 px-3 py-2.5">
                                                                <p className="text-sm whitespace-normal">
                                                                    {
                                                                        product.name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {
                                                                        product.category_name
                                                                    }
                                                                </p>
                                                            </td>
                                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                                {formatDate(
                                                                    product.expiration_date,
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right">
                                                                {
                                                                    product.quantity
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={
                                                                        product.quantity
                                                                    }
                                                                    value={
                                                                        selectedItems[
                                                                            product
                                                                                .product_ID
                                                                        ]
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateQuantity(
                                                                            product,
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="w-24"
                                                                    aria-label={`Quantity for ${product.name}`}
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                {
                                                                    product.measurement_unit
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={() =>
                                                                        toggleProduct(
                                                                            product,
                                                                            false,
                                                                        )
                                                                    }
                                                                    aria-label={`Remove ${product.name}`}
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                                {selectedProducts.length ===
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-3 py-8 text-center text-muted-foreground"
                                                        >
                                                            Select at least one
                                                            product to
                                                            distribute.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Stock is deducted only when the transfer
                                        is marked as sent.
                                    </p>
                                </div>
                                <FieldError
                                    message={
                                        createForm.errors.items ??
                                        Object.entries(createForm.errors).find(
                                            ([key]) => key.startsWith('items.'),
                                        )?.[1]
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                                disabled={createForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    createForm.processing ||
                                    Object.keys(selectedItems).length === 0 ||
                                    hasInvalidQuantities
                                }
                                className="bg-pink-600 px-6 text-white hover:bg-pink-700"
                            >
                                {createForm.processing
                                    ? 'Creating...'
                                    : 'Create distribution'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DistributionDetailsDialog
                distribution={details}
                onOpenChange={(open) => !open && setDetails(null)}
            />

            <Dialog
                open={distributionToSend !== null}
                onOpenChange={(open) =>
                    !open && !sending && setDistributionToSend(null)
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send distribution?</DialogTitle>
                        <DialogDescription>
                            This will mark distribution #
                            {distributionToSend?.distribution_ID} as in transit
                            and deduct its selected quantities from the source
                            inventory.
                        </DialogDescription>
                    </DialogHeader>

                    {distributionToSend && (
                        <div className="grid gap-3 rounded-md border p-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Transfer
                                </span>
                                <span className="text-right font-medium">
                                    {distributionToSend.from_branch.branch_name}{' '}
                                    → {distributionToSend.to_branch.branch_name}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Products
                                </span>
                                <span className="font-medium">
                                    {distributionToSend.items.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Total quantity
                                </span>
                                <span className="font-medium">
                                    {distributionToSend.total_quantity}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={sending}
                            onClick={() => setDistributionToSend(null)}
                        >
                            Keep scheduled
                        </Button>
                        <Button
                            type="button"
                            disabled={sending}
                            onClick={confirmSend}
                        >
                            <Send />
                            {sending ? 'Sending...' : 'Mark as sent'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={distributionToCancel !== null}
                onOpenChange={(open) => !open && setDistributionToCancel(null)}
            >
                <DialogContent>
                    <form onSubmit={submitCancellation}>
                        <DialogHeader>
                            <DialogTitle>Cancel distribution</DialogTitle>
                            <DialogDescription>
                                If this transfer is already in transit, its
                                items will be returned to the source inventory.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-2 py-5">
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
                            <Label htmlFor="cancellation-reason">
                                Reason
                                <span
                                    className="text-primary"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </Label>
                            <textarea
                                id="cancellation-reason"
                                required
                                maxLength={500}
                                value={cancelForm.data.cancellation_reason}
                                onChange={(event) =>
                                    cancelForm.setData(
                                        'cancellation_reason',
                                        event.target.value,
                                    )
                                }
                                className="min-h-24 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <FieldError
                                message={cancelForm.errors.cancellation_reason}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDistributionToCancel(null)}
                            >
                                Keep distribution
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={cancelForm.processing}
                            >
                                Cancel distribution
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function DistributionActions({
    distribution,
    onSend,
    onCancel,
}: {
    distribution: Distribution;
    onSend: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="flex justify-end gap-1">
            {distribution.can.send && (
                <TooltipIconButton
                    size="icon"
                    variant="ghost"
                    tooltip="Send distribution"
                    aria-label="Send distribution"
                    onClick={onSend}
                >
                    <Send />
                </TooltipIconButton>
            )}
            {distribution.can.receive && (
                <Button
                    size="sm"
                    onClick={() =>
                        router.patch(
                            receive.url(distribution.distribution_ID),
                            {},
                            {
                                preserveScroll: true,
                                onBefore: () =>
                                    window.confirm(
                                        'Confirm that this distribution was received?',
                                    ),
                            },
                        )
                    }
                >
                    <PackageCheck /> Receive
                </Button>
            )}
            {distribution.can.cancel && (
                <TooltipIconButton
                    size="icon"
                    variant="ghost"
                    onClick={onCancel}
                    tooltip="Cancel distribution"
                >
                    <XCircle />
                </TooltipIconButton>
            )}
            {distribution.can.delete && (
                <TooltipIconButton
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                        router.delete(
                            destroy.url(distribution.distribution_ID),
                            {
                                preserveScroll: true,
                                onBefore: () =>
                                    window.confirm(
                                        'Permanently delete this distribution record?',
                                    ),
                            },
                        )
                    }
                    tooltip="Delete record"
                >
                    <Trash2 />
                </TooltipIconButton>
            )}
        </div>
    );
}

function DistributionDetailsDialog({
    distribution,
    onOpenChange,
}: {
    distribution: Distribution | null;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={distribution !== null} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                {distribution && (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                Distribution #{distribution.distribution_ID}
                            </DialogTitle>
                            <DialogDescription>
                                {distribution.from_branch.branch_name} →{' '}
                                {distribution.to_branch.branch_name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-5 py-4">
                            <div className="grid gap-3 rounded-md border p-4 text-sm sm:grid-cols-2">
                                <Detail label="Status">
                                    <Badge
                                        variant={
                                            statusVariants[distribution.status]
                                        }
                                    >
                                        {statusLabels[distribution.status]}
                                    </Badge>
                                </Detail>
                                <Detail label="Created by">
                                    {distribution.created_by ??
                                        'System administrator'}
                                </Detail>
                                <Detail label="Created">
                                    {formatDate(distribution.created_at, true)}
                                </Detail>
                                <Detail label="Scheduled">
                                    {formatDate(
                                        distribution.scheduled_date,
                                        true,
                                    )}
                                </Detail>
                                {distribution.sent_date && (
                                    <Detail label="Sent">
                                        {formatDate(
                                            distribution.sent_date,
                                            true,
                                        )}
                                    </Detail>
                                )}
                                {distribution.received_date && (
                                    <Detail label="Received">
                                        {formatDate(
                                            distribution.received_date,
                                            true,
                                        )}
                                    </Detail>
                                )}
                            </div>

                            <div className="overflow-hidden rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40 text-left">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">
                                                Product
                                            </th>
                                            <th className="px-3 py-2 font-medium">
                                                Batch
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Quantity
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {distribution.items.map((item) => (
                                            <tr key={item.distribution_item_ID}>
                                                <td className="px-3 py-3">
                                                    <span className="font-medium">
                                                        {item.product_name}
                                                    </span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {item.category_name}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {item.expiration_date ??
                                                        'N/A'}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    {item.quantity}{' '}
                                                    {item.measurement_unit}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {distribution.notes && (
                                <Detail label="Notes">
                                    {distribution.notes}
                                </Detail>
                            )}
                            {distribution.cancellation_reason && (
                                <Detail label="Cancellation reason">
                                    {distribution.cancellation_reason}
                                </Detail>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Detail({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="mt-1">{children}</div>
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className="text-xs text-destructive">{message}</p>
    ) : null;
}
