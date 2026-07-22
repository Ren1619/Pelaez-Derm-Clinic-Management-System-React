import { MoreHorizontal } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
    return (
        <nav
            role="navigation"
            aria-label="pagination"
            data-slot="pagination"
            className={cn('flex w-full justify-center', className)}
            {...props}
        />
    );
}

function PaginationContent({
    className,
    ...props
}: React.ComponentProps<'ul'>) {
    return (
        <ul
            data-slot="pagination-content"
            className={cn('flex flex-row flex-wrap items-center gap-1', className)}
            {...props}
        />
    );
}

function PaginationItem(props: React.ComponentProps<'li'>) {
    return <li data-slot="pagination-item" {...props} />;
}

function PaginationEllipsis({
    className,
    ...props
}: React.ComponentProps<'span'>) {
    return (
        <span
            aria-hidden
            data-slot="pagination-ellipsis"
            className={cn('flex size-8 items-center justify-center', className)}
            {...props}
        >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">More pages</span>
        </span>
    );
}

export {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
};
