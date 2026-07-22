import { Boxes, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { PosProduct } from '@/types';
import { formatInventoryDate } from '../../inventory/components/expiration-badge';

type ProductDetailsDialogProps = {
    product: PosProduct | null;
    branchName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

function Detail({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </span>
            <div className="text-sm">{children}</div>
        </div>
    );
}

export function ProductDetailsDialog({
    product,
    branchName,
    open,
    onOpenChange,
}: ProductDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Boxes className="size-5" />
                        Product details
                    </DialogTitle>
                    <DialogDescription>
                        Review the selected product available at {branchName}.
                    </DialogDescription>
                </DialogHeader>

                {product && (
                    <div className="grid gap-5">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-52 w-full rounded-lg border bg-muted/40 object-contain p-2"
                            />
                        ) : (
                            <div className="flex h-52 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <ImageIcon className="size-8" />
                                    <span className="text-sm">No product image</span>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Detail label="Product name">{product.name}</Detail>
                            <Detail label="Category">
                                {product.category ?? 'Uncategorized'}
                            </Detail>
                            <Detail label="Branch">{branchName}</Detail>
                            <Detail label="Measurement unit">
                                {product.measurement_unit}
                            </Detail>
                            <Detail label="Quantity">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span>{product.quantity}</span>
                                    <Badge variant="secondary">
                                        {product.status}
                                    </Badge>
                                </div>
                            </Detail>
                            <Detail label="Price">
                                {currency.format(Number(product.price))}
                            </Detail>
                            <Detail label="Expiration date">
                                {formatInventoryDate(product.expiration_date)}
                            </Detail>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
