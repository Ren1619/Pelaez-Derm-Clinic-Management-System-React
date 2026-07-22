import { Minus, Plus, ShoppingCart, WalletCards, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PosCartItem, PosPatient } from '@/types';

type PosCartProps = {
    invoiceNumber: string;
    cart: PosCartItem[];
    patients: PosPatient[];
    customerName: string;
    selectedPatientId: number | null;
    discountPercentage: number;
    paymentMethod: 'cash' | 'card' | 'ewallet';
    amountReceived: number;
    subtotal: number;
    total: number;
    processing: boolean;
    errors: Record<string, string>;
    onCustomerNameChange: (value: string) => void;
    onPatientSelect: (patient: PosPatient | null) => void;
    onDiscountChange: (value: number) => void;
    onPaymentMethodChange: (value: 'cash' | 'card' | 'ewallet') => void;
    onAmountReceivedChange: (value: number) => void;
    onIncrement: (key: string) => void;
    onDecrement: (key: string) => void;
    onRemove: (key: string) => void;
    onCheckout: () => void;
};

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

export function PosCart({
    invoiceNumber,
    cart,
    patients,
    customerName,
    selectedPatientId,
    discountPercentage,
    paymentMethod,
    amountReceived,
    subtotal,
    total,
    processing,
    errors,
    onCustomerNameChange,
    onPatientSelect,
    onDiscountChange,
    onPaymentMethodChange,
    onAmountReceivedChange,
    onIncrement,
    onDecrement,
    onRemove,
    onCheckout,
}: PosCartProps) {
    const [showPatients, setShowPatients] = useState(false);
    const suggestions = useMemo(() => {
        const term = customerName.trim().toLocaleLowerCase();

        if (term.length < 2) {
            return [];
        }

        return patients
            .filter((patient) =>
                patient.full_name.toLocaleLowerCase().includes(term),
            )
            .slice(0, 8);
    }, [customerName, patients]);
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const discountAmount = subtotal - total;
    const change = Math.max(0, amountReceived - total);

    return (
        <aside className="flex min-h-[34rem] w-full shrink-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm lg:w-96">
            <div className="grid grid-cols-2 gap-3 border-b p-3 text-xs">
                <p className="col-span-2 text-left text-sm text-foreground">
                    All fields with{' '}
                    <span className="text-primary" aria-hidden="true">
                        *
                    </span>{' '}
                    are required.
                </p>
                <div>
                    <p className="text-muted-foreground">Invoice No.</p>
                    <p className="mt-1 font-semibold">{invoiceNumber}</p>
                </div>
                <div className="relative text-right">
                    <p className="text-muted-foreground">
                        {new Intl.DateTimeFormat('en-PH', {
                            dateStyle: 'medium',
                        }).format(new Date())}
                    </p>
                    <Label
                        htmlFor="customer-name"
                        className="mt-2 justify-end text-xs"
                    >
                        Customer name
                        <span className="text-primary" aria-hidden="true">
                            *
                        </span>
                    </Label>
                    <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(event) => {
                            onCustomerNameChange(event.target.value);
                            onPatientSelect(null);
                            setShowPatients(true);
                        }}
                        onFocus={() => setShowPatients(true)}
                        placeholder="Customer name"
                        className="mt-1 h-8 text-xs"
                        aria-label="Customer name"
                    />
                    {selectedPatientId !== null && (
                        <p className="mt-1 text-left text-[11px] text-muted-foreground">
                            Linked patient #{selectedPatientId}
                        </p>
                    )}
                    {showPatients && suggestions.length > 0 && (
                        <div className="absolute top-full right-0 left-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover text-left shadow-md">
                            {suggestions.map((patient) => (
                                <button
                                    key={patient.PID}
                                    type="button"
                                    className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted"
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => {
                                        onPatientSelect(patient);
                                        setShowPatients(false);
                                    }}
                                >
                                    <span className="block font-medium">
                                        {patient.full_name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        {patient.contact_number}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    {errors.customer_name && (
                        <p className="mt-1 text-left text-xs text-destructive">
                            {errors.customer_name}
                        </p>
                    )}
                </div>
            </div>

            <div className="min-h-40 flex-1 space-y-2 overflow-y-auto p-3">
                {cart.map((item) => (
                    <div
                        key={item.key}
                        className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 p-2"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                                {item.name}
                            </p>
                            <div className="mt-1 flex justify-between text-[11px]">
                                <span className="font-semibold text-primary">
                                    {currency.format(item.price)}
                                </span>
                                <span className="text-muted-foreground">
                                    Qty {item.quantity} ·{' '}
                                    {currency.format(
                                        item.price * item.quantity,
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <TooltipIconButton
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7"
                                tooltip={`Decrease ${item.name}`}
                                onClick={() => onDecrement(item.key)}
                                aria-label={`Decrease ${item.name}`}
                            >
                                <Minus className="size-3" />
                            </TooltipIconButton>
                            <TooltipIconButton
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7"
                                tooltip={`Increase ${item.name}`}
                                onClick={() => onIncrement(item.key)}
                                aria-label={`Increase ${item.name}`}
                            >
                                <Plus className="size-3" />
                            </TooltipIconButton>
                            <TooltipIconButton
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7 text-destructive"
                                tooltip={`Remove ${item.name}`}
                                onClick={() => onRemove(item.key)}
                                aria-label={`Remove ${item.name}`}
                            >
                                <X className="size-3" />
                            </TooltipIconButton>
                        </div>
                    </div>
                ))}

                {cart.length === 0 && (
                    <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                        <ShoppingCart className="size-10" />
                        <p className="text-sm font-medium">Cart is empty</p>
                        <p className="text-xs">
                            Add products or services to begin.
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-3 border-t bg-muted/20 p-3 text-xs">
                <div className="space-y-1.5">
                    <SummaryRow
                        label="Quantity"
                        value={String(totalQuantity)}
                    />
                    <SummaryRow
                        label="Subtotal"
                        value={currency.format(subtotal)}
                    />
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="discount"
                            className="text-xs font-normal"
                        >
                            Discount
                            <span className="text-primary" aria-hidden="true">
                                *
                            </span>
                        </Label>
                        <div className="flex items-center gap-1">
                            <Input
                                id="discount"
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={discountPercentage}
                                onChange={(event) =>
                                    onDiscountChange(
                                        Math.min(
                                            100,
                                            Math.max(
                                                0,
                                                Number(event.target.value),
                                            ),
                                        ),
                                    )
                                }
                                className="h-7 w-16 text-right text-xs"
                            />
                            <span>%</span>
                        </div>
                    </div>
                    <SummaryRow
                        label="Discount amount"
                        value={currency.format(discountAmount)}
                    />
                    <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
                        <span>Total</span>
                        <span className="text-base text-primary">
                            {currency.format(total)}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between gap-3">
                        <Label className="text-xs">
                            Payment
                            <span className="text-primary" aria-hidden="true">
                                *
                            </span>
                        </Label>
                        <Select
                            value={paymentMethod}
                            onValueChange={(value) =>
                                onPaymentMethodChange(
                                    value as 'cash' | 'card' | 'ewallet',
                                )
                            }
                        >
                            <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="ewallet">
                                    E-Wallet
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {paymentMethod === 'cash' && (
                        <>
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="received" className="text-xs">
                                    Received
                                </Label>
                                <Input
                                    id="received"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={amountReceived || ''}
                                    onChange={(event) =>
                                        onAmountReceivedChange(
                                            Math.max(
                                                0,
                                                Number(event.target.value),
                                            ),
                                        )
                                    }
                                    className="h-8 w-32 text-right text-xs"
                                />
                            </div>
                            <SummaryRow
                                label="Change"
                                value={currency.format(change)}
                            />
                        </>
                    )}
                    {errors.amount_received && (
                        <p className="text-xs text-destructive">
                            {errors.amount_received}
                        </p>
                    )}
                    {(errors.cart || errors.products || errors.services) && (
                        <p className="text-xs text-destructive">
                            {errors.cart || errors.products || errors.services}
                        </p>
                    )}
                </div>

                <Button
                    type="button"
                    className="w-full"
                    disabled={cart.length === 0 || processing}
                    onClick={onCheckout}
                >
                    <WalletCards />
                    {processing ? 'Processing…' : 'Pay now'}
                </Button>
            </div>
        </aside>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
