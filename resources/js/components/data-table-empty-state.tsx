import type { ReactNode } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';

type DataTableEmptyStateProps = {
    colSpan: number;
    icon?: ReactNode;
    title: string;
    description?: ReactNode;
};

export function DataTableEmptyState({
    colSpan,
    icon,
    title,
    description,
}: DataTableEmptyStateProps) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="h-40 text-center">
                <div className="flex flex-col items-center gap-3 py-8">
                    {icon}
                    <div className="grid gap-1">
                        <p className="font-medium text-foreground">{title}</p>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
}
