import { Form } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { destroy } from '@/actions/App/Http/Controllers/PatientController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Patient } from '@/types';

type PatientDeleteDialogProps = {
    patient: Patient | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function PatientDeleteDialog({
    patient,
    open,
    onOpenChange,
}: PatientDeleteDialogProps) {
    return (
        <Dialog open={open && patient !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-destructive" />
                        Delete patient
                    </DialogTitle>
                    <DialogDescription>
                        This permanently deletes{' '}
                        <strong className="text-foreground">
                            {patient?.full_name}
                        </strong>
                        . This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {patient && (
                    <Form
                        {...destroy.form(patient)}
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
                                        : 'Delete patient'}
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
