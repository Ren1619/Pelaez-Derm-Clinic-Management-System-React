import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { show } from '@/routes/patients';
import type {
    Patient,
    PatientRecordFilters,
    PatientVisitPaginator,
} from '@/types';

type PatientRecordPaginationProps = {
    patient: Patient;
    visits: PatientVisitPaginator;
    filters: PatientRecordFilters;
};

export function PatientRecordPagination({
    patient,
    visits,
    filters,
}: PatientRecordPaginationProps) {
    const routeForPage = (page: number) =>
        show(patient, {
            query: {
                page,
                per_page: filters.per_page,
                date_from: filters.date_from,
                date_to: filters.date_to,
            },
        });

    return (
        <div className="flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
                Showing {visits.from ?? 0} to {visits.to ?? 0} of {visits.total}{' '}
                visits
            </p>

            <div className="flex items-center gap-2">
                {visits.current_page > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(visits.current_page - 1)}
                            preserveScroll
                            preserveState
                            only={['visits', 'filters']}
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
                    Page {visits.current_page} of {visits.last_page}
                </span>

                {visits.current_page < visits.last_page ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(visits.current_page + 1)}
                            preserveScroll
                            preserveState
                            only={['visits', 'filters']}
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
