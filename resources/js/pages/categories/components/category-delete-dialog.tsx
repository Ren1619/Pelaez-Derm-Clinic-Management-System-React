import { Form } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { destroy } from '@/actions/App/Http/Controllers/CategoryController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Category } from '@/types';

type CategoryDeleteDialogProps = {
    category: Category | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function CategoryDeleteDialog({
    category,
    open,
    onOpenChange,
}: CategoryDeleteDialogProps) {
    if (!category) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="size-5 text-destructive" />
                        Delete category
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete “
                        {category.category_name}”? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...destroy.form(category)}
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
                                {processing ? 'Deleting...' : 'Delete category'}
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
