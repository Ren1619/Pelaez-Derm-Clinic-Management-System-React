import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/patients';
import type { PatientFilters, PatientPaginator } from '@/types';

type PatientPaginationProps = {
    patients: PatientPaginator;
    filters: PatientFilters;
};

export function PatientPagination({
    patients,
    filters,
}: PatientPaginationProps) {
    const routeForPage = (page: number) =>
        index({
            query: {
                page,
                search: filters.search || undefined,
                verification: filters.verification ?? undefined,
                per_page: filters.per_page,
            },
        });

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
                Showing {patients.from ?? 0} to {patients.to ?? 0} of{' '}
                {patients.total} patients
            </p>

            <div className="flex items-center gap-2">
                {patients.current_page > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(patients.current_page - 1)}
                            preserveScroll
                            preserveState
                            only={['patients', 'filters']}
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
                    Page {patients.current_page} of {patients.last_page}
                </span>

                {patients.current_page < patients.last_page ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(patients.current_page + 1)}
                            preserveScroll
                            preserveState
                            only={['patients', 'filters']}
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
