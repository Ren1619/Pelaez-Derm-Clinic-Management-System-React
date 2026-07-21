import { ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Badge } from '@/components/ui/badge';
import type { ProductBatch } from '@/types';
import {
    ExpirationBadge,
    formatInventoryDate,
    formatInventoryPrice,
} from './expiration-badge';

type DetailedInventoryTableProps = {
    products: ProductBatch[];
    onView: (product: ProductBatch) => void;
    onEdit: (product: ProductBatch) => void;
    onRestock: (product: ProductBatch) => void;
    onDelete: (product: ProductBatch) => void;
};

export function DetailedInventoryTable({
    products,
    onView,
    onEdit,
    onRestock,
    onDelete,
}: DetailedInventoryTableProps) {
    return (
        <table className="w-full min-w-6xl text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Expiration</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {products.map((product) => (
                    <ClickableTableRow
                        key={product.product_ID}
                        accessibleLabel={`View ${product.name} batch ${product.batch_number ?? 'N/A'}`}
                        onActivate={() => onView(product)}
                    >
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt=""
                                        className="size-11 rounded-md border object-cover"
                                    />
                                ) : (
                                    <div className="flex size-11 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                                        <ImageIcon className="size-5" />
                                    </div>
                                )}
                                <span className="font-medium">
                                    {product.name}
                                </span>
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                    Batch {product.batch_number ?? 'N/A'}
                                </Badge>
                                {product.is_primary && <Badge>Primary</Badge>}
                            </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                            {product.measurement_unit}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                            {product.category.category_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                            {product.branch.branch_name}
                        </td>
                        <td className="px-4 py-3 font-medium">
                            {product.quantity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                            {formatInventoryPrice(product.price)}
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-2 whitespace-nowrap">
                                <span>
                                    {formatInventoryDate(
                                        product.expiration_date,
                                    )}
                                </span>
                                <ExpirationBadge product={product} />
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                                <TooltipIconButton
                                    variant="ghost"
                                    size="icon"
                                    tooltip={`Edit ${product.name} batch ${product.batch_number ?? 'N/A'}`}
                                    onClick={() => onEdit(product)}
                                >
                                    <Pencil />
                                </TooltipIconButton>
                                {product.can_restock && (
                                    <TooltipIconButton
                                        variant="ghost"
                                        size="icon"
                                        tooltip={`Restock ${product.name} batch ${product.batch_number ?? 'N/A'}`}
                                        onClick={() => onRestock(product)}
                                    >
                                        <Plus className="text-emerald-600" />
                                    </TooltipIconButton>
                                )}
                                <TooltipIconButton
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    tooltip={`Delete ${product.name} batch ${product.batch_number ?? 'N/A'}`}
                                    onClick={() => onDelete(product)}
                                >
                                    <Trash2 />
                                </TooltipIconButton>
                            </div>
                        </td>
                    </ClickableTableRow>
                ))}
            </tbody>
        </table>
    );
}
