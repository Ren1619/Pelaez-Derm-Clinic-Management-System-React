import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/services';
import type { ServiceFilters, ServicePaginator } from '@/types';

type ServicePaginationProps = {
    services: ServicePaginator;
    filters: ServiceFilters;
};

export function ServicePagination({
    services,
    filters,
}: ServicePaginationProps) {
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
                Showing {services.from ?? 0} to {services.to ?? 0} of{' '}
                {services.total} services
            </p>

            <div className="flex items-center gap-2">
                {services.current_page > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(services.current_page - 1)}
                            preserveScroll
                            preserveState
                            only={['services', 'filters']}
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
                    Page {services.current_page} of {services.last_page}
                </span>

                {services.current_page < services.last_page ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(services.current_page + 1)}
                            preserveScroll
                            preserveState
                            only={['services', 'filters']}
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
