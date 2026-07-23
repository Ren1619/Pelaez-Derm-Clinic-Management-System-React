import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type DataTableLayoutProps = {
    children: ReactNode;
    toolbar?: ReactNode;
    footer?: ReactNode;
    className?: string;
};

export function DataTableLayout({
    children,
    toolbar,
    footer,
    className,
}: DataTableLayoutProps) {
    return (
        <Card className={cn('gap-0 overflow-hidden py-0', className)}>
            {toolbar}
            {children}
            {footer}
        </Card>
    );
}

export function DataTableToolbar({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 border-b p-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-start',
                className,
            )}
            {...props}
        />
    );
}

export function DataTableFooter({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
            {...props}
        />
    );
}
