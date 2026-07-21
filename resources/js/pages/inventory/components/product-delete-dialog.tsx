import { Form } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { destroy } from '@/actions/App/Http/Controllers/InventoryController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ProductBatch } from '@/types';

type ProductDeleteDialogProps = {
    product: ProductBatch | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ProductDeleteDialog({
    product,
    open,
    onOpenChange,
}: ProductDeleteDialogProps) {
    return (
        <Dialog open={open && product !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-destructive" />
                        Delete product batch
                    </DialogTitle>
                    <DialogDescription>
                        This permanently deletes{' '}
                        <strong className="text-foreground">
                            {product?.name}
                        </strong>{' '}
                        batch {product?.batch_number ?? ''} and its uploaded
                        image. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {product && (
                    <Form
                        {...destroy.form(product)}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ processing }) => (
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Deleting...'
                                        : 'Delete batch'}
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
