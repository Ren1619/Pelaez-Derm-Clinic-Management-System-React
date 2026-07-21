import { Form } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { destroy } from '@/actions/App/Http/Controllers/ServiceController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ClinicService } from '@/types';

type ServiceDeleteDialogProps = {
    service: ClinicService | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ServiceDeleteDialog({
    service,
    open,
    onOpenChange,
}: ServiceDeleteDialogProps) {
    return (
        <Dialog open={open && service !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-destructive" />
                        Delete service
                    </DialogTitle>
                    <DialogDescription>
                        This permanently deletes{' '}
                        <strong className="text-foreground">
                            {service?.name}
                        </strong>{' '}
                        and its uploaded image. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {service && (
                    <Form
                        {...destroy.form(service)}
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
                                        : 'Delete service'}
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
