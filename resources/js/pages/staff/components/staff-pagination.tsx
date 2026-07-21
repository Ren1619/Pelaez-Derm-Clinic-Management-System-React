import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/staff';
import type { StaffFilters, StaffPaginator } from '@/types';

type StaffPaginationProps = {
    staffAccounts: StaffPaginator;
    filters: StaffFilters;
};

export function StaffPagination({
    staffAccounts,
    filters,
}: StaffPaginationProps) {
    const routeForPage = (page: number) =>
        index({
            query: {
                page,
                search: filters.search || undefined,
                branch_ID: filters.branch_ID ?? undefined,
                role_ID: filters.role_ID ?? undefined,
                verification: filters.verification ?? undefined,
                status: filters.status ?? undefined,
                per_page: filters.per_page,
            },
        });

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
                Showing {staffAccounts.from ?? 0} to {staffAccounts.to ?? 0} of{' '}
                {staffAccounts.total} staff members
            </p>

            <div className="flex items-center gap-2">
                {staffAccounts.current_page > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(staffAccounts.current_page - 1)}
                            preserveScroll
                            preserveState
                            only={['staffAccounts', 'filters']}
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
                    Page {staffAccounts.current_page} of{' '}
                    {staffAccounts.last_page}
                </span>

                {staffAccounts.current_page < staffAccounts.last_page ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(staffAccounts.current_page + 1)}
                            preserveScroll
                            preserveState
                            only={['staffAccounts', 'filters']}
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
