import { Head, router } from '@inertiajs/react';
import { Download, Search, ScrollText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { exportMethod, index } from '@/routes/logs';
import type {
    ActivityLog,
    ActivityLogFilters,
    ActivityLogPaginator,
} from '@/types';

type LogsIndexProps = {
    logs: ActivityLogPaginator;
    filters: ActivityLogFilters;
    contexts: Record<string, string>;
    contextCounts: Record<string, number>;
};

export default function LogsIndex({
    logs,
    filters,
    contexts,
    contextCounts,
}: LogsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    const visit = (changes: Partial<ActivityLogFilters>) => {
        const next = { ...filters, ...changes };

        router.get(index.url(), logQuery(next), {
            only: ['logs', 'filters', 'contextCounts'],
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => visit({ search }), 350);

        return () => window.clearTimeout(timeout);
        // The current server filters define the next visit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters.search]);

    const exportUrl = exportMethod({ query: logQuery(filters) }).url;

    return (
        <>
            <Head title="Activity Logs" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Activity Logs"
                        description="Review create, read, update, delete, and restore activity throughout the system."
                    />
                    <Button variant="outline" asChild>
                        <a href={exportUrl}>
                            <Download /> Export CSV
                        </a>
                    </Button>
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="grid gap-4 border-b p-4 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_repeat(4,minmax(8.5rem,1fr))] xl:items-end">
                        <FilterField label="Search logs">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Person, record, or details..."
                                    className="pl-9"
                                />
                            </div>
                        </FilterField>

                        <FilterField label="Log type">
                            <Select
                                value={filters.context}
                                onValueChange={(context) => visit({ context })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <ContextOption
                                            label="All logs"
                                            count={contextCounts.all ?? 0}
                                        />
                                    </SelectItem>
                                    {Object.entries(contexts).map(
                                        ([context, label]) => (
                                            <SelectItem
                                                key={context}
                                                value={context}
                                            >
                                                <ContextOption
                                                    label={label}
                                                    count={
                                                        contextCounts[
                                                            context
                                                        ] ?? 0
                                                    }
                                                />
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Time period">
                            <Select
                                value={filters.time_period}
                                onValueChange={(value) => {
                                    const timePeriod =
                                        value as ActivityLogFilters['time_period'];

                                    visit(
                                        timePeriod === 'custom'
                                            ? {
                                                  time_period: timePeriod,
                                                  date_from:
                                                      filters.date_from ??
                                                      currentDate(),
                                                  date_to:
                                                      filters.date_to ??
                                                      currentDate(),
                                              }
                                            : { time_period: timePeriod },
                                    );
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_time">
                                        All time
                                    </SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">
                                        Yesterday
                                    </SelectItem>
                                    <SelectItem value="this_week">
                                        This week
                                    </SelectItem>
                                    <SelectItem value="this_month">
                                        This month
                                    </SelectItem>
                                    <SelectItem value="last_3_months">
                                        Last 3 months
                                    </SelectItem>
                                    <SelectItem value="last_year">
                                        Last year
                                    </SelectItem>
                                    <SelectItem value="custom">
                                        Custom range
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Performed by">
                            <Select
                                value={filters.actor_type}
                                onValueChange={(value) =>
                                    visit({
                                        actor_type:
                                            value as ActivityLogFilters['actor_type'],
                                    })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Everyone
                                    </SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="patient">
                                        Patients
                                    </SelectItem>
                                    <SelectItem value="system">
                                        System
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Action">
                            <Select
                                value={filters.action}
                                onValueChange={(value) =>
                                    visit({
                                        action: value as ActivityLogFilters['action'],
                                    })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All actions
                                    </SelectItem>
                                    <SelectItem value="created">
                                        Created
                                    </SelectItem>
                                    <SelectItem value="viewed">
                                        Viewed
                                    </SelectItem>
                                    <SelectItem value="updated">
                                        Updated
                                    </SelectItem>
                                    <SelectItem value="deleted">
                                        Deleted
                                    </SelectItem>
                                    <SelectItem value="restored">
                                        Restored
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>

                    {filters.time_period === 'custom' && (
                        <div className="grid gap-4 border-b bg-muted/20 p-4 sm:grid-cols-2 sm:justify-end lg:grid-cols-[12rem_12rem]">
                            <FilterField label="From date">
                                <Input
                                    type="date"
                                    value={filters.date_from ?? ''}
                                    onChange={(event) => {
                                        const dateFrom = event.target.value;

                                        visit({
                                            date_from: dateFrom,
                                            date_to:
                                                filters.date_to &&
                                                filters.date_to >= dateFrom
                                                    ? filters.date_to
                                                    : dateFrom,
                                        });
                                    }}
                                />
                            </FilterField>
                            <FilterField label="To date">
                                <Input
                                    type="date"
                                    value={filters.date_to ?? ''}
                                    min={filters.date_from ?? undefined}
                                    onChange={(event) =>
                                        visit({ date_to: event.target.value })
                                    }
                                />
                            </FilterField>
                        </div>
                    )}

                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-5xl text-sm">
                            <thead className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <tr>
                                    <th className="w-20 px-4 py-3">#</th>
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Performed by</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.data.map((log, position) => (
                                    <ClickableTableRow
                                        key={log.activity_log_ID}
                                        accessibleLabel={`View log ${log.activity_log_ID}`}
                                        onActivate={() => setSelectedLog(log)}
                                    >
                                        <td className="px-4 py-4 text-muted-foreground">
                                            {(logs.current_page - 1) *
                                                logs.per_page +
                                                position +
                                                1}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <Timestamp value={log.created_at} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <Actor log={log} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant="outline">
                                                {contexts[log.context] ??
                                                    titleCase(log.context)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="max-w-md px-4 py-4">
                                            <p className="line-clamp-2">
                                                {log.description}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {log.subject.type}
                                                {log.subject.id
                                                    ? ` #${log.subject.id}`
                                                    : ''}
                                            </p>
                                        </td>
                                    </ClickableTableRow>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-3 p-4 lg:hidden">
                        {logs.data.map((log) => (
                            <button
                                key={log.activity_log_ID}
                                type="button"
                                onClick={() => setSelectedLog(log)}
                                className="grid gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/30"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium">
                                            Log #
                                            {String(
                                                log.activity_log_ID,
                                            ).padStart(6, '0')}
                                        </p>
                                        <Timestamp value={log.created_at} />
                                    </div>
                                    <ActionBadge action={log.action} />
                                </div>
                                <Actor log={log} />
                                <p className="text-sm">{log.description}</p>
                                <Badge variant="outline">
                                    {contexts[log.context] ??
                                        titleCase(log.context)}
                                </Badge>
                            </button>
                        ))}
                    </div>

                    {logs.data.length === 0 && (
                        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                            <ScrollText className="size-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">No logs found</p>
                                <p className="text-sm text-muted-foreground">
                                    Try changing the current search or filters.
                                </p>
                            </div>
                        </div>
                    )}

                    <Pagination logs={logs} filters={filters} />
                </Card>
            </div>

            <LogDetailsDialog
                log={selectedLog}
                contexts={contexts}
                open={selectedLog !== null}
                onOpenChange={(open) => !open && setSelectedLog(null)}
            />
        </>
    );
}

function FilterField({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function ContextOption({ label, count }: { label: string; count: number }) {
    return (
        <span className="flex min-w-36 items-center justify-between gap-4">
            <span>{label}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {count > 999 ? '999+' : count}
            </span>
        </span>
    );
}

function Actor({ log }: { log: ActivityLog }) {
    return (
        <div className="flex min-w-44 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {log.actor.type === 'system' ? (
                    <ScrollText className="size-4" />
                ) : (
                    log.actor.name.charAt(0).toUpperCase()
                )}
            </div>
            <div className="min-w-0">
                <p className="truncate font-medium">{log.actor.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    {log.actor.role
                        ? titleCase(log.actor.role)
                        : titleCase(log.actor.type)}
                </p>
            </div>
        </div>
    );
}

function Timestamp({ value }: { value: string }) {
    const timestamp = new Date(value);

    return (
        <div>
            <p className="font-medium">
                {timestamp.toLocaleDateString([], { dateStyle: 'medium' })}
            </p>
            <p className="text-xs text-muted-foreground">
                {timestamp.toLocaleTimeString([], { timeStyle: 'medium' })}
            </p>
        </div>
    );
}

function ActionBadge({ action }: { action: ActivityLog['action'] }) {
    return (
        <Badge
            variant={
                action === 'deleted'
                    ? 'destructive'
                    : action === 'created' || action === 'restored'
                      ? 'default'
                      : 'secondary'
            }
        >
            {titleCase(action)}
        </Badge>
    );
}

function Pagination({
    logs,
    filters,
}: {
    logs: ActivityLogPaginator;
    filters: ActivityLogFilters;
}) {
    const goToPage = (page: number) => {
        router.get(
            index.url(),
            { ...logQuery(filters), page },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {logs.from ?? 0}–{logs.to ?? 0} of {logs.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="logs-per-page">Rows</Label>
                <Select
                    value={String(filters.per_page)}
                    onValueChange={(value) =>
                        router.get(
                            index.url(),
                            {
                                ...logQuery(filters),
                                per_page: Number(value),
                            },
                            { preserveState: true, preserveScroll: true },
                        )
                    }
                >
                    <SelectTrigger id="logs-per-page" className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={logs.current_page <= 1}
                    onClick={() => goToPage(logs.current_page - 1)}
                >
                    Previous
                </Button>
                <span className="text-sm">
                    {logs.current_page} / {logs.last_page}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={logs.current_page >= logs.last_page}
                    onClick={() => goToPage(logs.current_page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

function LogDetailsDialog({
    log,
    contexts,
    open,
    onOpenChange,
}: {
    log: ActivityLog | null;
    contexts: Record<string, string>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (log === null) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        Log #{String(log.activity_log_ID).padStart(6, '0')}
                    </DialogTitle>
                    <DialogDescription>
                        Complete audit details for this system activity.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Detail label="Timestamp">
                        {new Date(log.created_at).toLocaleString([], {
                            dateStyle: 'long',
                            timeStyle: 'medium',
                        })}
                    </Detail>
                    <Detail label="Performed by">
                        {log.actor.name} ({titleCase(log.actor.type)})
                    </Detail>
                    <Detail label="Category">
                        {contexts[log.context] ?? titleCase(log.context)}
                    </Detail>
                    <Detail label="Action">{titleCase(log.action)}</Detail>
                    <Detail label="Record">
                        {log.subject.label ?? log.subject.type}
                        {log.subject.id ? ` (#${log.subject.id})` : ''}
                    </Detail>
                    <Detail label="Request">
                        {[log.request.method, log.request.route]
                            .filter(Boolean)
                            .join(' · ') || 'System process'}
                    </Detail>
                    <Detail label="IP address">
                        {log.request.ip_address ?? 'Not available'}
                    </Detail>
                    <Detail label="Path">
                        {log.request.url ?? 'Not available'}
                    </Detail>
                </div>

                <Detail label="Description">{log.description}</Detail>

                {(log.old_values !== null || log.new_values !== null) && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Snapshot
                            title="Previous values"
                            values={log.old_values}
                        />
                        <Snapshot title="New values" values={log.new_values} />
                    </div>
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
        <div className="grid gap-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <div className="text-sm break-words">{children}</div>
        </div>
    );
}

function Snapshot({
    title,
    values,
}: {
    title: string;
    values: Record<string, unknown> | null;
}) {
    return (
        <div className="rounded-lg border">
            <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                {title}
            </div>
            <dl className="divide-y text-sm">
                {values && Object.keys(values).length > 0 ? (
                    Object.entries(values).map(([key, value]) => (
                        <div key={key} className="grid gap-1 px-3 py-2">
                            <dt className="text-xs font-medium text-muted-foreground">
                                {titleCase(key)}
                            </dt>
                            <dd className="break-all">{formatValue(value)}</dd>
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-4 text-muted-foreground">
                        No values
                    </div>
                )}
            </dl>
        </div>
    );
}

function logQuery(filters: ActivityLogFilters) {
    return {
        search: filters.search || undefined,
        context: filters.context,
        action: filters.action,
        actor_type: filters.actor_type,
        time_period: filters.time_period,
        date_from:
            filters.time_period === 'custom'
                ? (filters.date_from ?? undefined)
                : undefined,
        date_to:
            filters.time_period === 'custom'
                ? (filters.date_to ?? undefined)
                : undefined,
        per_page: filters.per_page,
    };
}

function formatValue(value: unknown): string {
    if (value === null || value === '') {
        return 'None';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

function titleCase(value: string): string {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function currentDate(): string {
    const date = new Date();
    const offset = date.getTimezoneOffset();

    return new Date(date.getTime() - offset * 60_000)
        .toISOString()
        .slice(0, 10);
}

LogsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Activity Logs',
            href: index(),
        },
    ],
};
