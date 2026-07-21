import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/categories';
import type { CategoryFilters, CategoryPaginator } from '@/types';

type CategoryPaginationProps = {
    categories: CategoryPaginator;
    filters: CategoryFilters;
};

export function CategoryPagination({
    categories,
    filters,
}: CategoryPaginationProps) {
    const routeForPage = (page: number) =>
        index({
            query: {
                page,
                tab: filters.tab,
                search: filters.search || undefined,
                per_page: filters.per_page,
            },
        });

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
                Showing {categories.from ?? 0} to {categories.to ?? 0} of{' '}
                {categories.total} categories
            </p>

            <div className="flex items-center gap-2">
                {categories.current_page > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(categories.current_page - 1)}
                            preserveScroll
                            preserveState
                            only={['categories', 'filters']}
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
                    Page {categories.current_page} of {categories.last_page}
                </span>

                {categories.current_page < categories.last_page ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={routeForPage(categories.current_page + 1)}
                            preserveScroll
                            preserveState
                            only={['categories', 'filters']}
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
