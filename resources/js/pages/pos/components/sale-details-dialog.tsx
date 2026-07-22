import { Form, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, RotateCcw, Undo2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { receipt, voidMethod } from '@/routes/pos/sales';
import { store as storeReturn } from '@/routes/pos/sales/returns';
import type { PosSale } from '@/types';

type SaleDetailsDialogProps = {
    sale: PosSale | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

export function SaleDetailsDialog({
    sale,
    open,
    onOpenChange,
}: SaleDetailsDialogProps) {
    const [mode, setMode] = useState<'details' | 'return' | 'void'>('details');
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>(
        {},
    );

    if (sale === null) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setMode('details');
                    setSelectedItems({});
                }

                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {mode !== 'details' && (
                            <TooltipIconButton
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                tooltip="Back to sale details"
                                onClick={() => setMode('details')}
                            >
                                <ArrowLeft />
                            </TooltipIconButton>
                        )}
                        {mode === 'details'
                            ? `Sale ${sale.invoice_number}`
                            : mode === 'return'
                              ? 'Process partial return'
                              : 'Void entire sale'}
                    </DialogTitle>
                    <DialogDescription>
                        {sale.customer_name} · {sale.branch_name} ·{' '}
                        {new Intl.DateTimeFormat('en-PH', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        }).format(new Date(sale.created_at))}
                    </DialogDescription>
                </DialogHeader>

                {mode === 'details' ? (
                    <SaleDetails sale={sale} />
                ) : mode === 'return' ? (
                    <ReturnForm
                        sale={sale}
                        selectedItems={selectedItems}
                        onSelectedItemsChange={setSelectedItems}
                        onSuccess={() => onOpenChange(false)}
                    />
                ) : (
                    <VoidForm
                        sale={sale}
                        onSuccess={() => onOpenChange(false)}
                    />
                )}

                {mode === 'details' && (
                    <DialogFooter className="flex-wrap sm:justify-between">
                        <Button variant="outline" asChild>
                            <Link href={receipt(sale.sale_ID)} target="_blank">
                                <Printer /> Receipt
                            </Link>
                        </Button>
                        <div className="flex flex-wrap gap-2">
                            {sale.can_return && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setMode('return')}
                                >
                                    <RotateCcw /> Partial return
                                </Button>
                            )}
                            {sale.can_void && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setMode('void')}
                                >
                                    <Undo2 /> Void sale
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SaleDetails({ sale }: { sale: PosSale }) {
    return (
        <div className="space-y-5">
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-4">
                <Metric label="Payment" value={sale.pay_method.toUpperCase()} />
                <Metric label="Items" value={String(sale.total_items)} />
                <Metric
                    label="Original total"
                    value={currency.format(Number(sale.total_cost))}
                />
                <Metric
                    label="Net total"
                    value={currency.format(Number(sale.net_total))}
                />
            </div>

            {sale.is_voided && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive">Voided sale</p>
                    <p className="mt-1 text-muted-foreground">
                        {sale.void_reason} · {sale.voided_by ?? 'Former user'}
                    </p>
                </div>
            )}

            <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground uppercase">
                        <tr>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                            <th className="px-3 py-2 text-right">Price</th>
                            <th className="px-3 py-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sale.items.map((item) => (
                            <tr key={`${item.type}-${item.item_ID}`}>
                                <td className="px-3 py-2">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {item.type}
                                        {item.returned_quantity > 0 &&
                                            ` · ${item.returned_quantity} returned`}
                                    </p>
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {item.quantity}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {currency.format(Number(item.price))}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                    {currency.format(Number(item.subtotal))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="ml-auto max-w-sm space-y-2 text-sm">
                <Metric
                    label="Subtotal"
                    value={currency.format(Number(sale.subtotal_cost))}
                    horizontal
                />
                <Metric
                    label={`Discount (${Number(sale.discount_perc)}%)`}
                    value={`− ${currency.format(Number(sale.discount_amount))}`}
                    horizontal
                />
                <Metric
                    label="Returned"
                    value={`− ${currency.format(Number(sale.total_returned))}`}
                    horizontal
                />
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                    <span>Net total</span>
                    <span>{currency.format(Number(sale.net_total))}</span>
                </div>
            </div>

            {sale.returns.length > 0 && (
                <div>
                    <h3 className="mb-2 text-sm font-semibold">
                        Return history
                    </h3>
                    <div className="space-y-2">
                        {sale.returns.map((item) => (
                            <div
                                key={item.return_ID}
                                className="rounded-lg border p-3 text-sm"
                            >
                                <div className="flex justify-between gap-3">
                                    <p className="font-medium capitalize">
                                        {item.return_type} return
                                    </p>
                                    <p className="font-semibold">
                                        {currency.format(
                                            Number(item.return_amount),
                                        )}
                                    </p>
                                </div>
                                <p className="mt-1 text-muted-foreground">
                                    {item.return_reason} · {item.processed_by}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ReturnForm({
    sale,
    selectedItems,
    onSelectedItemsChange,
    onSuccess,
}: {
    sale: PosSale;
    selectedItems: Record<string, number>;
    onSelectedItemsChange: (items: Record<string, number>) => void;
    onSuccess: () => void;
}) {
    const items = sale.items.filter((item) => item.returnable_quantity > 0);
    const selected = items.filter(
        (item) => selectedItems[`${item.type}-${item.item_ID}`] > 0,
    );

    return (
        <Form
            {...storeReturn.form(sale.sale_ID)}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    <div className="space-y-2">
                        {items.map((item) => {
                            const selectionKey = `${item.type}-${item.item_ID}`;
                            const quantity = selectedItems[selectionKey] ?? 0;

                            return (
                                <div
                                    key={`${item.type}-${item.item_ID}`}
                                    className="flex items-center gap-3 rounded-lg border p-3"
                                >
                                    <input
                                        type="checkbox"
                                        checked={quantity > 0}
                                        onChange={(event) =>
                                            onSelectedItemsChange({
                                                ...selectedItems,
                                                [selectionKey]: event.target
                                                    .checked
                                                    ? 1
                                                    : 0,
                                            })
                                        }
                                        aria-label={`Return ${item.name}`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Up to {item.returnable_quantity}{' '}
                                            returnable
                                        </p>
                                    </div>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={item.returnable_quantity}
                                        disabled={quantity === 0}
                                        value={quantity || ''}
                                        onChange={(event) =>
                                            onSelectedItemsChange({
                                                ...selectedItems,
                                                [selectionKey]: Math.min(
                                                    item.returnable_quantity,
                                                    Math.max(
                                                        1,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                ),
                                            })
                                        }
                                        className="w-20"
                                    />
                                </div>
                            );
                        })}
                    </div>
                    {selected.map((item, index) => (
                        <div key={`input-${item.type}-${item.item_ID}`}>
                            <input
                                type="hidden"
                                name={`items[${index}][type]`}
                                value={item.type}
                            />
                            <input
                                type="hidden"
                                name={`items[${index}][item_ID]`}
                                value={item.item_ID}
                            />
                            <input
                                type="hidden"
                                name={`items[${index}][quantity]`}
                                value={
                                    selectedItems[
                                        `${item.type}-${item.item_ID}`
                                    ]
                                }
                            />
                        </div>
                    ))}
                    <ReturnReasonFields errors={errors} />
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={processing || selected.length === 0}
                        >
                            {processing ? 'Processing…' : 'Process return'}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

function VoidForm({
    sale,
    onSuccess,
}: {
    sale: PosSale;
    onSuccess: () => void;
}) {
    return (
        <Form
            {...voidMethod.form(sale.sale_ID)}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                        This refunds {currency.format(Number(sale.total_cost))},
                        restores all products, and permanently marks the sale as
                        voided.
                    </div>
                    <ReturnReasonFields errors={errors} />
                    <DialogFooter>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={processing}
                        >
                            {processing ? 'Voiding…' : 'Void sale'}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

function ReturnReasonFields({ errors }: { errors: Record<string, string> }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="reason">Reason</Label>
                <Select name="reason" required>
                    <SelectTrigger id="reason">
                        <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Damaged product">
                            Damaged product
                        </SelectItem>
                        <SelectItem value="Wrong item">Wrong item</SelectItem>
                        <SelectItem value="Customer request">
                            Customer request
                        </SelectItem>
                        <SelectItem value="Quality issue">
                            Quality issue
                        </SelectItem>
                        <SelectItem value="Service not rendered">
                            Service not rendered
                        </SelectItem>
                        <SelectItem value="Duplicate charge">
                            Duplicate charge
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.reason} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="refund_method">Refund method</Label>
                <Select name="refund_method" defaultValue="cash" required>
                    <SelectTrigger id="refund_method">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="ewallet">E-Wallet</SelectItem>
                        <SelectItem value="store_credit">
                            Store credit
                        </SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.refund_method} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" maxLength={2000} />
                <InputError message={errors.notes} />
            </div>
            <InputError message={errors.sale} className="sm:col-span-2" />
            <InputError message={errors.items} className="sm:col-span-2" />
        </div>
    );
}

function Metric({
    label,
    value,
    horizontal = false,
}: {
    label: string;
    value: string;
    horizontal?: boolean;
}) {
    return (
        <div className={horizontal ? 'flex justify-between gap-3' : ''}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}
