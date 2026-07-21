import {
    ChevronRight,
    Eye,
    ImageIcon,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
};

export function GroupedInventoryTable({
    groups,
    onView,
    onEdit,
    onRestock,
    onDelete,
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
        <table className="w-full min-w-6xl text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <tr>
                    <th className="w-12 px-4 py-3" aria-label="Expand" />
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Batches</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Total quantity</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Primary expiry</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y">
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
            </tbody>
        </table>
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
            <tr className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        aria-expanded={expanded}
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${group.name} batches`}
                    >
                        <ChevronRight
                            className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
                        />
                    </Button>
                </td>
                <td className="px-4 py-3">
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
                        <button
                            type="button"
                            className="font-medium underline-offset-4 hover:underline"
                            onClick={() => onView(group.primary_batch)}
                        >
                            {group.name}
                        </button>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <Badge variant="secondary">
                        {group.batch_count}{' '}
                        {group.batch_count === 1 ? 'batch' : 'batches'}
                    </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                    {group.measurement_unit}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                    {group.category.category_name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                    {group.branch.branch_name}
                </td>
                <td className="px-4 py-3 font-medium">
                    {group.total_quantity}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                    {formatInventoryPrice(group.price)}
                </td>
                <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-2 whitespace-nowrap">
                        <span>
                            {formatInventoryDate(group.primary_expiration_date)}
                        </span>
                        <ExpirationBadge product={group.primary_batch} />
                    </div>
                </td>
                <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(group.primary_batch)}
                            aria-label={`Edit ${group.name}`}
                        >
                            <Pencil />
                        </Button>
                        {group.can_restock && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRestock(group.primary_batch)}
                                aria-label={`Restock ${group.name}`}
                            >
                                <Plus className="text-emerald-600" />
                            </Button>
                        )}
                    </div>
                </td>
            </tr>

            {expanded &&
                group.batches.map((batch) => (
                    <tr key={batch.product_ID} className="bg-muted/20">
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                    Batch {batch.batch_number}
                                </Badge>
                                {batch.is_primary && <Badge>Primary</Badge>}
                            </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                            {batch.quantity} {batch.measurement_unit}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                            {batch.measurement_unit}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                            {batch.category.category_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                            {batch.branch.branch_name}
                        </td>
                        <td className="px-4 py-3">{batch.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                            {formatInventoryPrice(batch.price)}
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-2 whitespace-nowrap">
                                <span>
                                    {formatInventoryDate(batch.expiration_date)}
                                </span>
                                <ExpirationBadge product={batch} />
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onView(batch)}
                                    aria-label={`View ${batch.name} batch ${batch.batch_number}`}
                                >
                                    <Eye />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(batch)}
                                    aria-label={`Edit ${batch.name} batch ${batch.batch_number}`}
                                >
                                    <Pencil />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => onDelete(batch)}
                                    aria-label={`Delete ${batch.name} batch ${batch.batch_number}`}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
        </>
    );
}
