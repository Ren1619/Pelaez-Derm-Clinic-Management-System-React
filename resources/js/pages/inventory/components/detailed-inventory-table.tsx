import { ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import {
    NewRecordBadge,
    newRecordRowClass,
} from '@/components/new-record-indicator';
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
    emptyState?: ReactNode;
};

export function DetailedInventoryTable({
    products,
    onView,
    onEdit,
    onRestock,
    onDelete,
    emptyState,
}: DetailedInventoryTableProps) {
    return (
        <Table className="min-w-6xl">
            <TableHeader>
                <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <ClickableTableRow
                        key={product.product_ID}
                        accessibleLabel={`View ${product.name} batch ${product.batch_number ?? 'N/A'}`}
                        onActivate={() => onView(product)}
                        className={newRecordRowClass(product)}
                    >
                        <TableCell>
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
                                {product.is_new && <NewRecordBadge />}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                    Batch {product.batch_number ?? 'N/A'}
                                </Badge>
                                {product.is_primary && <Badge>Primary</Badge>}
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {product.measurement_unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {product.category.category_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {product.branch.branch_name}
                        </TableCell>
                        <TableCell className="font-medium">
                            {product.quantity}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                            {formatInventoryPrice(product.price)}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col items-start gap-2 whitespace-nowrap">
                                <span>
                                    {formatInventoryDate(
                                        product.expiration_date,
                                    )}
                                </span>
                                <ExpirationBadge product={product} />
                            </div>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                    </ClickableTableRow>
                ))}
                {products.length === 0 && emptyState}
            </TableBody>
        </Table>
    );
}
