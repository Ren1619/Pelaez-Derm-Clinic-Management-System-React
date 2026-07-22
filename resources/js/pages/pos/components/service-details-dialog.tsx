import { ImageIcon, Sparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { PosService } from '@/types';

type ServiceDetailsDialogProps = {
    service: PosService | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

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

export function ServiceDetailsDialog({
    service,
    open,
    onOpenChange,
}: ServiceDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5" />
                        Service details
                    </DialogTitle>
                    <DialogDescription>
                        Review the selected service information.
                    </DialogDescription>
                </DialogHeader>

                {service && (
                    <div className="grid gap-5">
                        {service.image_url ? (
                            <img
                                src={service.image_url}
                                alt={service.name}
                                className="h-52 w-full rounded-lg border bg-muted/40 object-contain p-2"
                            />
                        ) : (
                            <div className="flex h-52 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <ImageIcon className="size-8" />
                                    <span className="text-sm">No service image</span>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Detail label="Service name">{service.name}</Detail>
                            <Detail label="Category">
                                {service.category ?? 'Uncategorized'}
                            </Detail>
                            <Detail label="Description">
                                {service.description || 'No description provided'}
                            </Detail>
                            <Detail label="Price">Custom price at checkout</Detail>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
