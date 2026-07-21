import { Form } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { destroy } from '@/actions/App/Http/Controllers/BranchController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Branch } from '@/types';

type BranchDeleteDialogProps = {
    branch: Branch | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function BranchDeleteDialog({
    branch,
    open,
    onOpenChange,
}: BranchDeleteDialogProps) {
    return (
        <Dialog open={open && branch !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-destructive" />
                        Delete branch
                    </DialogTitle>
                    <DialogDescription>
                        This permanently deletes{' '}
                        <strong className="text-foreground">
                            {branch?.branch_name}
                        </strong>{' '}
                        and its uploaded image. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {branch && (
                    <Form
                        {...destroy.form(branch)}
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
                                        : 'Delete branch'}
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
