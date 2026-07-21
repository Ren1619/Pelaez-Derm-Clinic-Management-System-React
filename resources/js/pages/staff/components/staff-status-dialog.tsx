import { Form } from '@inertiajs/react';
import { Power, PowerOff } from 'lucide-react';
import { toggleStatus } from '@/actions/App/Http/Controllers/StaffAccountController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { StaffAccount } from '@/types';

type StaffStatusDialogProps = {
    staffAccount: StaffAccount | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function StaffStatusDialog({
    staffAccount,
    open,
    onOpenChange,
}: StaffStatusDialogProps) {
    if (!staffAccount) {
        return null;
    }

    const isDisabling = staffAccount.is_active;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isDisabling ? (
                            <PowerOff className="size-5 text-destructive" />
                        ) : (
                            <Power className="size-5 text-emerald-600" />
                        )}
                        {isDisabling ? 'Disable' : 'Enable'} staff account
                    </DialogTitle>
                    <DialogDescription>
                        {isDisabling
                            ? `${staffAccount.full_name} will no longer be able to use this staff account.`
                            : `${staffAccount.full_name} will regain access to this staff account.`}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...toggleStatus.form(staffAccount)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <div className="grid gap-4">
                            <InputError message={errors.status} />
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
                                    variant={
                                        isDisabling ? 'destructive' : 'default'
                                    }
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Updating...'
                                        : isDisabling
                                          ? 'Disable account'
                                          : 'Enable account'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
