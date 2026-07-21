import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/inventory';
import type { InventoryFilters, InventoryPaginator } from '@/types';

type InventoryPaginationProps = {
    inventory: InventoryPaginator;
    filters: InventoryFilters;
};

export function InventoryPagination({
    inventory,
    filters,
}: InventoryPaginationProps) {
    const routeForPage = (page: number) =>
        index({
            query: {
                page,
                status: filters.status,
                view: filters.view,
                search: filters.search || undefined,
                branch_ID: filters.branch_ID ?? undefined,
                per_page: filters.per_page,
            },
        });

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
                Showing {inventory.from ?? 0} to {inventory.to ?? 0} of{' '}
                {inventory.total}{' '}
                {filters.view === 'grouped' ? 'products' : 'batches'}
            </p>

            <div className="flex items-center gap-2">
                {inventory.current_page > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(inventory.current_page - 1)}
                            preserveScroll
                            preserveState
                            only={['inventory', 'filters']}
                        >
                            <ChevronLeft /> Previous
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft /> Previous
                    </Button>
                )}

                <span className="min-w-20 text-center text-muted-foreground">
                    Page {inventory.current_page} of {inventory.last_page}
                </span>

                {inventory.current_page < inventory.last_page ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(inventory.current_page + 1)}
                            preserveScroll
                            preserveState
                            only={['inventory', 'filters']}
                        >
                            Next <ChevronRight />
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Next <ChevronRight />
                    </Button>
                )}
            </div>
        </div>
    );
}
