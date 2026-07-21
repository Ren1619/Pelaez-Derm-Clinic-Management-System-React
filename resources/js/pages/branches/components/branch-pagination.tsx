import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/branches';
import type { BranchFilters, BranchPaginator } from '@/types';

type BranchPaginationProps = {
    branches: BranchPaginator;
    filters: BranchFilters;
};

export function BranchPagination({ branches, filters }: BranchPaginationProps) {
    const routeForPage = (page: number) =>
        index({
            query: {
                page,
                search: filters.search || undefined,
                per_page: filters.per_page,
            },
        });

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
                Showing {branches.from ?? 0} to {branches.to ?? 0} of{' '}
                {branches.total} branches
            </p>

            <div className="flex items-center gap-2">
                {branches.current_page > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(branches.current_page - 1)}
                            preserveScroll
                            preserveState
                            only={['branches', 'filters']}
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
                    Page {branches.current_page} of {branches.last_page}
                </span>

                {branches.current_page < branches.last_page ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(branches.current_page + 1)}
                            preserveScroll
                            preserveState
                            only={['branches', 'filters']}
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
