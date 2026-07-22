import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { DataTableFooter } from '@/components/data-table-layout';
import { Button } from '@/components/ui/button';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type PaginatorMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type PaginationToken = number | 'start-ellipsis' | 'end-ellipsis';

type DataTablePaginationProps = {
    paginator: PaginatorMeta;
    itemLabel: string;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    pageSizes?: number[];
    className?: string;
};

function paginationTokens(
    currentPage: number,
    lastPage: number,
): PaginationToken[] {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const tokens: PaginationToken[] = [1];
    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(lastPage - 1, currentPage + 1);

    if (windowStart > 2) {
        tokens.push('start-ellipsis');
    }

    for (let page = windowStart; page <= windowEnd; page += 1) {
        tokens.push(page);
    }

    if (windowEnd < lastPage - 1) {
        tokens.push('end-ellipsis');
    }

    tokens.push(lastPage);

    return tokens;
}

export function DataTablePagination({
    paginator,
    itemLabel,
    onPageChange,
    onPerPageChange,
    pageSizes = [10, 25, 50],
    className,
}: DataTablePaginationProps) {
    const rowsId = useId();
    const tokens = paginationTokens(
        paginator.current_page,
        paginator.last_page,
    );

    return (
        <DataTableFooter className={className}>
            <p className="text-muted-foreground">
                Showing {paginator.from ?? 0} to {paginator.to ?? 0} of{' '}
                {paginator.total} {itemLabel}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <label htmlFor={rowsId} className="font-medium">
                        Rows per page
                    </label>
                    <Select
                        value={String(paginator.per_page)}
                        onValueChange={(value) =>
                            onPerPageChange(Number(value))
                        }
                    >
                        <SelectTrigger id={rowsId} className="h-8 w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizes.map((pageSize) => (
                                <SelectItem
                                    key={pageSize}
                                    value={String(pageSize)}
                                >
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Pagination className="w-auto justify-start sm:justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={paginator.current_page <= 1}
                                onClick={() =>
                                    onPageChange(paginator.current_page - 1)
                                }
                            >
                                <ChevronLeft />
                                <span className="hidden md:inline">
                                    Previous
                                </span>
                            </Button>
                        </PaginationItem>

                        {tokens.map((token) =>
                            typeof token === 'number' ? (
                                <PaginationItem
                                    key={token}
                                    className="hidden sm:block"
                                >
                                    <Button
                                        variant={
                                            token === paginator.current_page
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="icon"
                                        className="size-8"
                                        aria-current={
                                            token === paginator.current_page
                                                ? 'page'
                                                : undefined
                                        }
                                        aria-label={`Go to page ${token}`}
                                        onClick={() => onPageChange(token)}
                                    >
                                        {token}
                                    </Button>
                                </PaginationItem>
                            ) : (
                                <PaginationItem
                                    key={token}
                                    className="hidden sm:block"
                                >
                                    <PaginationEllipsis />
                                </PaginationItem>
                            ),
                        )}

                        <PaginationItem>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    paginator.current_page >=
                                    paginator.last_page
                                }
                                onClick={() =>
                                    onPageChange(paginator.current_page + 1)
                                }
                            >
                                <span className="hidden md:inline">Next</span>
                                <ChevronRight />
                            </Button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </DataTableFooter>
    );
}
