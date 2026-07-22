import { ChevronRight, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ProductBatch, ProductGroup } from '@/types';
import {
    ExpirationBadge,
    formatInventoryDate,
    formatInventoryPrice,
} from './expiration-badge';

type GroupedInventoryTableProps = {
    groups: ProductGroup[];
    onView: (product: ProductBatch) => void;
    onEdit: (product: ProductBatch) => void;
    onRestock: (product: ProductBatch) => void;
    onDelete: (product: ProductBatch) => void;
    emptyState?: ReactNode;
};

export function GroupedInventoryTable({
    groups,
    onView,
    onEdit,
    onRestock,
    onDelete,
    emptyState,
}: GroupedInventoryTableProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(),
    );

    const toggleGroup = (key: string) => {
        setExpandedGroups((current) => {
            const next = new Set(current);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    };

    return (
        <Table className="min-w-6xl">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-12" aria-label="Expand" />
                    <TableHead>Product</TableHead>
                    <TableHead>Batches</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Total quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Primary expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {groups.map((group) => {
                    const isExpanded = expandedGroups.has(group.key);

                    return (
                        <GroupRows
                            key={group.key}
                            group={group}
                            expanded={isExpanded}
                            onToggle={() => toggleGroup(group.key)}
                            onView={onView}
                            onEdit={onEdit}
                            onRestock={onRestock}
                            onDelete={onDelete}
                        />
                    );
                })}
                {groups.length === 0 && emptyState}
            </TableBody>
        </Table>
    );
}

type GroupRowsProps = {
    group: ProductGroup;
    expanded: boolean;
    onToggle: () => void;
    onView: (product: ProductBatch) => void;
    onEdit: (product: ProductBatch) => void;
    onRestock: (product: ProductBatch) => void;
    onDelete: (product: ProductBatch) => void;
};

function GroupRows({
    group,
    expanded,
    onToggle,
    onView,
    onEdit,
    onRestock,
    onDelete,
}: GroupRowsProps) {
    return (
        <>
            <ClickableTableRow
                accessibleLabel={`${expanded ? 'Collapse' : 'Expand'} ${group.name} batches`}
                onActivate={onToggle}
                aria-expanded={expanded}
            >
                <TableCell>
                    <TooltipIconButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        tooltip={`${expanded ? 'Collapse' : 'Expand'} ${group.name} batches`}
                        onClick={onToggle}
                        aria-expanded={expanded}
                    >
                        <ChevronRight
                            className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
                        />
                    </TooltipIconButton>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-3">
                        {group.image_url ? (
                            <img
                                src={group.image_url}
                                alt=""
                                className="size-11 rounded-md border object-cover"
                            />
                        ) : (
                            <div className="flex size-11 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                                <ImageIcon className="size-5" />
                            </div>
                        )}
                        <span className="font-medium">{group.name}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary">
                        {group.batch_count}{' '}
                        {group.batch_count === 1 ? 'batch' : 'batches'}
                    </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                    {group.measurement_unit}
                </TableCell>
                <TableCell className="text-muted-foreground">
                    {group.category.category_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                    {group.branch.branch_name}
                </TableCell>
                <TableCell className="font-medium">
                    {group.total_quantity}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                    {formatInventoryPrice(group.price)}
                </TableCell>
                <TableCell>
                    <div className="flex flex-col items-start gap-2 whitespace-nowrap">
                        <span>
                            {formatInventoryDate(group.primary_expiration_date)}
                        </span>
                        <ExpirationBadge product={group.primary_batch} />
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex justify-end gap-1">
                        <TooltipIconButton
                            variant="ghost"
                            size="icon"
                            tooltip={`Edit ${group.name}`}
                            onClick={() => onEdit(group.primary_batch)}
                        >
                            <Pencil />
                        </TooltipIconButton>
                        {group.can_restock && (
                            <TooltipIconButton
                                variant="ghost"
                                size="icon"
                                tooltip={`Restock ${group.name}`}
                                onClick={() => onRestock(group.primary_batch)}
                            >
                                <Plus className="text-emerald-600" />
                            </TooltipIconButton>
                        )}
                    </div>
                </TableCell>
            </ClickableTableRow>

            {expanded &&
                group.batches.map((batch) => (
                    <ClickableTableRow
                        key={batch.product_ID}
                        className="bg-muted/20"
                        accessibleLabel={`View ${batch.name} batch ${batch.batch_number}`}
                        onActivate={() => onView(batch)}
                    >
                        <TableCell />
                        <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                    Batch {batch.batch_number}
                                </Badge>
                                {batch.is_primary && <Badge>Primary</Badge>}
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {batch.quantity} {batch.measurement_unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {batch.measurement_unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {batch.category.category_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {batch.branch.branch_name}
                        </TableCell>
                        <TableCell>{batch.quantity}</TableCell>
                        <TableCell className="whitespace-nowrap">
                            {formatInventoryPrice(batch.price)}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col items-start gap-2 whitespace-nowrap">
                                <span>
                                    {formatInventoryDate(batch.expiration_date)}
                                </span>
                                <ExpirationBadge product={batch} />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex justify-end gap-1">
                                <TooltipIconButton
                                    variant="ghost"
                                    size="icon"
                                    tooltip={`Edit ${batch.name} batch ${batch.batch_number}`}
                                    onClick={() => onEdit(batch)}
                                >
                                    <Pencil />
                                </TooltipIconButton>
                                <TooltipIconButton
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    tooltip={`Delete ${batch.name} batch ${batch.batch_number}`}
                                    onClick={() => onDelete(batch)}
                                >
                                    <Trash2 />
                                </TooltipIconButton>
                            </div>
                        </TableCell>
                    </ClickableTableRow>
                ))}
        </>
    );
}
