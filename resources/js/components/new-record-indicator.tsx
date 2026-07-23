import { router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import NewRecordEventController from '@/actions/App/Http/Controllers/NewRecordEventController';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
    NewRecordSummary,
    NewRecordTracked,
    TrackableStaffModule,
} from '@/types';

type UpdatedValue = { changed: boolean; value: unknown };

function markEventInValue(value: unknown, eventId: number): UpdatedValue {
    if (Array.isArray(value)) {
        let changed = false;
        const next = value.map((item) => {
            const updated = markEventInValue(item, eventId);
            changed ||= updated.changed;
            return updated.value;
        });

        return { changed, value: changed ? next : value };
    }

    if (value === null || typeof value !== 'object') {
        return { changed: false, value };
    }

    const record = value as Record<string, unknown>;
    let changed =
        record.new_record_event_id === eventId && record.is_new === true;
    const next: Record<string, unknown> = changed
        ? { ...record, is_new: false }
        : { ...record };

    for (const [key, child] of Object.entries(record)) {
        const updated = markEventInValue(child, eventId);

        if (updated.changed) {
            next[key] = updated.value;
            changed = true;
        }
    }

    return { changed, value: changed ? next : value };
}

export function markNewRecordSeen(
    record: NewRecordTracked,
    module: TrackableStaffModule,
    onSuccess?: () => void,
): boolean {
    const eventId = record.new_record_event_id;

    if (!record.is_new || eventId === null) {
        onSuccess?.();
        return false;
    }

    router
        .optimistic((pageProps) => {
            const props = pageProps as Record<string, unknown>;
            const updates: Record<string, unknown> = {};

            for (const [key, value] of Object.entries(props)) {
                if (key === 'newRecordSummary') {
                    continue;
                }

                const updated = markEventInValue(value, eventId);
                if (updated.changed) {
                    updates[key] = updated.value;
                }
            }

            const summary = props.newRecordSummary as NewRecordSummary;
            const currentCount = summary.counts[module] ?? 0;

            updates.newRecordSummary = {
                counts: {
                    ...summary.counts,
                    [module]: Math.max(0, currentCount - 1),
                },
                total_count: Math.max(0, summary.total_count - 1),
            } satisfies NewRecordSummary;

            return updates;
        })
        .patch(NewRecordEventController.url(eventId), {}, {
            preserveScroll: true,
            preserveState: true,
            only: ['newRecordSummary'],
            onSuccess,
        });

    return true;
}

export function NewRecordBadge({
    className,
    children = 'New',
}: {
    className?: string;
    children?: ReactNode;
}) {
    return (
        <Badge
            className={cn('border-primary/30 bg-primary/10 text-primary', className)}
            variant="outline"
        >
            {children}
        </Badge>
    );
}

export function newRecordRowClass(
    record: NewRecordTracked,
    className?: string,
): string {
    return cn(
        className,
        record.is_new &&
            'border-l-4 border-l-primary bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15',
    );
}

export function newRecordCardClass(
    record: NewRecordTracked,
    className?: string,
): string {
    return cn(
        className,
        record.is_new &&
            'border-primary bg-primary/5 ring-2 ring-primary/30 dark:bg-primary/10',
    );
}
