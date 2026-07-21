import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/pos';
import type { PosSale } from '@/types';

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

export default function PosReceipt({ sale }: { sale: PosSale }) {
    return (
        <>
            <Head title={`Receipt ${sale.invoice_number}`} />
            <div className="mx-auto w-full max-w-2xl p-4 sm:p-8 print:max-w-none print:p-0">
                <div className="mb-4 flex items-center justify-between print:hidden">
                    <Button variant="outline" asChild>
                        <Link href={index()}>
                            <ArrowLeft /> Back to POS
                        </Link>
                    </Button>
                    <Button type="button" onClick={() => window.print()}>
                        <Printer /> Print receipt
                    </Button>
                </div>

                <main className="rounded-xl border bg-card p-6 shadow-sm sm:p-10 print:rounded-none print:border-0 print:shadow-none">
                    <header className="border-b pb-6 text-center">
                        <p className="text-xl font-semibold">
                            Pelaez Dermatology Clinic
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {sale.branch_name}
                        </p>
                        <p className="mt-4 text-sm font-medium">
                            OFFICIAL RECEIPT
                        </p>
                    </header>

                    <section className="grid grid-cols-2 gap-4 border-b py-5 text-sm">
                        <ReceiptField
                            label="Invoice"
                            value={sale.invoice_number}
                        />
                        <ReceiptField
                            label="Date"
                            value={new Intl.DateTimeFormat('en-PH', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            }).format(new Date(sale.created_at))}
                            right
                        />
                        <ReceiptField
                            label="Customer"
                            value={sale.customer_name}
                        />
                        <ReceiptField
                            label="Cashier"
                            value={sale.processed_by}
                            right
                        />
                    </section>

                    <section className="py-5">
                        <table className="w-full text-sm">
                            <thead className="border-b text-left text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="py-2">Item</th>
                                    <th className="py-2 text-right">Qty</th>
                                    <th className="py-2 text-right">Price</th>
                                    <th className="py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sale.items.map((item) => (
                                    <tr key={`${item.type}-${item.item_ID}`}>
                                        <td className="py-3">
                                            <p className="font-medium">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {item.type}
                                            </p>
                                        </td>
                                        <td className="py-3 text-right">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 text-right">
                                            {currency.format(
                                                Number(item.price),
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            {currency.format(
                                                Number(item.subtotal),
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="ml-auto max-w-sm space-y-2 border-t pt-5 text-sm">
                        <TotalRow
                            label="Subtotal"
                            value={currency.format(Number(sale.subtotal_cost))}
                        />
                        <TotalRow
                            label={`Discount (${Number(sale.discount_perc)}%)`}
                            value={`− ${currency.format(Number(sale.discount_amount))}`}
                        />
                        {Number(sale.total_returned) > 0 && (
                            <TotalRow
                                label="Returns"
                                value={`− ${currency.format(Number(sale.total_returned))}`}
                            />
                        )}
                        <div className="flex justify-between border-t pt-3 text-lg font-semibold">
                            <span>Total</span>
                            <span>
                                {currency.format(Number(sale.net_total))}
                            </span>
                        </div>
                        <TotalRow
                            label="Payment"
                            value={sale.pay_method.toUpperCase()}
                        />
                        {sale.amount_received !== null && (
                            <TotalRow
                                label="Received"
                                value={currency.format(
                                    Number(sale.amount_received),
                                )}
                            />
                        )}
                        {sale.change_amount !== null && (
                            <TotalRow
                                label="Change"
                                value={currency.format(
                                    Number(sale.change_amount),
                                )}
                            />
                        )}
                    </section>

                    {sale.is_voided && (
                        <section className="mt-6 border border-destructive/50 p-4 text-center text-sm text-destructive">
                            VOIDED · {sale.void_reason}
                        </section>
                    )}

                    <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
                        <p>Thank you for visiting Pelaez Dermatology Clinic.</p>
                        <p className="mt-1">
                            Please keep this receipt for your records.
                        </p>
                    </footer>
                </main>
            </div>
        </>
    );
}

function ReceiptField({
    label,
    value,
    right = false,
}: {
    label: string;
    value: string;
    right?: boolean;
}) {
    return (
        <div className={right ? 'text-right' : ''}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium">{value}</p>
        </div>
    );
}

function TotalRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
        </div>
    );
}

PosReceipt.layout = {
    breadcrumbs: [
        { title: 'Point of Sale', href: index() },
        { title: 'Receipt', href: '#' },
    ],
};
