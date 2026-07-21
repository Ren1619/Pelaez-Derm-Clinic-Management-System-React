import { Head, router } from '@inertiajs/react';
import {
    Eye,
    ImageIcon,
    Plus,
    ReceiptText,
    Search,
    ShoppingBag,
    Sparkles,
    Tags,
    Trash2,
    WalletCards,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { checkout, index } from '@/routes/pos';
import { destroy as destroyExpense } from '@/routes/pos/expenses';
import type {
    PosBranch,
    PosCartItem,
    PosExpense,
    PosExpenseCategory,
    PosFilters,
    PosPatient,
    PosProduct,
    PosSale,
    PosService,
} from '@/types';
import {
    ExpenseCategoryDialog,
    ExpenseDialog,
} from './components/expense-dialogs';
import { PosCart } from './components/pos-cart';
import { SaleDetailsDialog } from './components/sale-details-dialog';

type PosIndexProps = {
    branches: PosBranch[];
    products: PosProduct[];
    services: PosService[];
    patients: PosPatient[];
    dailySales: PosSale[];
    dailySummary: {
        gross: number;
        voided: number;
        returned: number;
        net: number;
    };
    expenseCategories: PosExpenseCategory[];
    expenses: PosExpense[];
    expenseSummary: { total: number; count: number };
    filters: PosFilters;
};

type PosTab = 'products' | 'services' | 'daily-sales' | 'expenses';

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

export default function PosIndex({
    branches,
    products,
    services,
    patients,
    dailySales,
    dailySummary,
    expenseCategories,
    expenses,
    expenseSummary,
    filters,
}: PosIndexProps) {
    const [activeTab, setActiveTab] = useState<PosTab>('products');
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<PosCartItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [patientId, setPatientId] = useState<number | null>(null);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<
        'cash' | 'card' | 'ewallet'
    >('cash');
    const [amountReceived, setAmountReceived] = useState(0);
    const [checkoutErrors, setCheckoutErrors] = useState<
        Record<string, string>
    >({});
    const [checkoutProcessing, setCheckoutProcessing] = useState(false);
    const [confirmCheckout, setConfirmCheckout] = useState(false);
    const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<PosService | null>(
        null,
    );
    const [servicePrice, setServicePrice] = useState(0);
    const [serviceQuantity, setServiceQuantity] = useState(1);
    const [selectedSale, setSelectedSale] = useState<PosSale | null>(null);
    const [saleDialogOpen, setSaleDialogOpen] = useState(false);
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [cart],
    );
    const total = Math.max(
        0,
        Math.round((subtotal - subtotal * (discountPercentage / 100)) * 100) /
            100,
    );
    const filteredProducts = products.filter((product) => {
        const term = search.trim().toLocaleLowerCase();

        return (
            term === '' ||
            product.name.toLocaleLowerCase().includes(term) ||
            product.category?.toLocaleLowerCase().includes(term)
        );
    });
    const filteredServices = services.filter((service) => {
        const term = search.trim().toLocaleLowerCase();

        return (
            term === '' ||
            service.name.toLocaleLowerCase().includes(term) ||
            service.category?.toLocaleLowerCase().includes(term)
        );
    });
    const invoiceNumber = `INV-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll('-', '')}-NEW`;

    const visitFilters = (changes: Partial<PosFilters>) => {
        const next = { ...filters, ...changes };

        router.get(
            index.url(),
            {
                branch_ID: next.branch_ID,
                sales_date: next.sales_date,
                expense_month: next.expense_month,
                expense_year: next.expense_year,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const addProduct = (product: PosProduct) => {
        setCart((current) => {
            const key = `product-${product.product_ID}`;
            const existing = current.find((item) => item.key === key);

            if (existing) {
                return current.map((item) =>
                    item.key === key && item.quantity < product.quantity
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }

            return [
                ...current,
                {
                    key,
                    type: 'product',
                    id: product.product_ID,
                    name: product.name,
                    price: Number(product.price),
                    quantity: 1,
                    available: product.quantity,
                },
            ];
        });
    };

    const openServiceDialog = (service: PosService) => {
        setSelectedService(service);
        setServicePrice(0);
        setServiceQuantity(1);
        setServiceDialogOpen(true);
    };

    const addService = () => {
        if (selectedService === null || servicePrice <= 0) {
            return;
        }

        const key = `service-${selectedService.service_ID}`;
        setCart((current) => {
            const existing = current.find((item) => item.key === key);

            if (existing) {
                return current.map((item) =>
                    item.key === key
                        ? {
                              ...item,
                              price: servicePrice,
                              quantity: item.quantity + serviceQuantity,
                          }
                        : item,
                );
            }

            return [
                ...current,
                {
                    key,
                    type: 'service',
                    id: selectedService.service_ID,
                    name: selectedService.name,
                    price: servicePrice,
                    quantity: serviceQuantity,
                },
            ];
        });
        setServiceDialogOpen(false);
    };

    const changeQuantity = (key: string, direction: 1 | -1) => {
        setCart((current) =>
            current.flatMap((item) => {
                if (item.key !== key) {
                    return [item];
                }

                const nextQuantity = item.quantity + direction;

                if (nextQuantity <= 0) {
                    return [];
                }

                if (item.type === 'product' && nextQuantity > item.available) {
                    return [item];
                }

                return [{ ...item, quantity: nextQuantity }];
            }),
        );
    };

    const checkoutSale = () => {
        setCheckoutProcessing(true);
        setCheckoutErrors({});
        router.post(
            checkout.url(),
            {
                branch_ID: filters.branch_ID,
                PID: patientId,
                customer_name: customerName,
                discount_percentage: discountPercentage,
                payment_method: paymentMethod,
                amount_received:
                    paymentMethod === 'cash' ? amountReceived : total,
                products: cart
                    .filter((item) => item.type === 'product')
                    .map((item) => ({
                        product_ID: item.id,
                        quantity: item.quantity,
                    })),
                services: cart
                    .filter((item) => item.type === 'service')
                    .map((item) => ({
                        service_ID: item.id,
                        quantity: item.quantity,
                        custom_price: item.price,
                    })),
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setCheckoutErrors(errors);
                    setConfirmCheckout(false);
                },
                onSuccess: () => {
                    setCart([]);
                    setCustomerName('');
                    setPatientId(null);
                    setDiscountPercentage(0);
                    setAmountReceived(0);
                    setConfirmCheckout(false);
                },
                onFinish: () => setCheckoutProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="Point of Sale" />

            <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col gap-4 overflow-auto p-3 sm:p-4 lg:flex-row lg:overflow-hidden lg:p-6">
                <Card className="flex min-h-[34rem] min-w-0 flex-1 flex-col gap-0 overflow-hidden py-0">
                    <div className="shrink-0 space-y-3 border-b p-4">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1 sm:max-w-sm">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder={
                                        activeTab === 'services'
                                            ? 'Search services…'
                                            : 'Search products…'
                                    }
                                    className="pl-9"
                                    disabled={
                                        activeTab === 'daily-sales' ||
                                        activeTab === 'expenses'
                                    }
                                />
                            </div>
                            <Select
                                value={String(filters.branch_ID)}
                                onValueChange={(value) => {
                                    setCart([]);
                                    visitFilters({ branch_ID: Number(value) });
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-52">
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.branch_ID}
                                            value={String(branch.branch_ID)}
                                        >
                                            {branch.branch_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <nav
                            className="-mb-4 flex min-w-max gap-5 overflow-x-auto"
                            aria-label="Point of sale sections"
                        >
                            {(
                                [
                                    ['products', 'Products'],
                                    ['services', 'Services'],
                                    ['daily-sales', 'Daily Sales'],
                                    ['expenses', 'Expenses'],
                                ] as Array<[PosTab, string]>
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(value);
                                        setSearch('');
                                    }}
                                    className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                                        activeTab === value
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        {activeTab === 'products' && (
                            <CatalogGrid
                                items={filteredProducts}
                                type="product"
                                onAdd={addProduct}
                            />
                        )}
                        {activeTab === 'services' && (
                            <CatalogGrid
                                items={filteredServices}
                                type="service"
                                onAdd={openServiceDialog}
                            />
                        )}
                        {activeTab === 'daily-sales' && (
                            <DailySales
                                sales={dailySales}
                                summary={dailySummary}
                                date={filters.sales_date}
                                onDateChange={(sales_date) =>
                                    visitFilters({ sales_date })
                                }
                                onView={(sale) => {
                                    setSelectedSale(sale);
                                    setSaleDialogOpen(true);
                                }}
                            />
                        )}
                        {activeTab === 'expenses' && (
                            <Expenses
                                expenses={expenses}
                                summary={expenseSummary}
                                filters={filters}
                                onFiltersChange={visitFilters}
                                onAdd={() => setExpenseDialogOpen(true)}
                                onAddCategory={() =>
                                    setCategoryDialogOpen(true)
                                }
                            />
                        )}
                    </div>
                </Card>

                <PosCart
                    invoiceNumber={invoiceNumber}
                    cart={cart}
                    patients={patients}
                    customerName={customerName}
                    selectedPatientId={patientId}
                    discountPercentage={discountPercentage}
                    paymentMethod={paymentMethod}
                    amountReceived={amountReceived}
                    subtotal={subtotal}
                    total={total}
                    processing={checkoutProcessing}
                    errors={checkoutErrors}
                    onCustomerNameChange={setCustomerName}
                    onPatientSelect={(patient) => {
                        setPatientId(patient?.PID ?? null);

                        if (patient) {
                            setCustomerName(patient.full_name);
                        }
                    }}
                    onDiscountChange={setDiscountPercentage}
                    onPaymentMethodChange={setPaymentMethod}
                    onAmountReceivedChange={setAmountReceived}
                    onIncrement={(key) => changeQuantity(key, 1)}
                    onDecrement={(key) => changeQuantity(key, -1)}
                    onRemove={(key) =>
                        setCart((current) =>
                            current.filter((item) => item.key !== key),
                        )
                    }
                    onCheckout={() => setConfirmCheckout(true)}
                />
            </div>

            <Dialog
                open={serviceDialogOpen}
                onOpenChange={setServiceDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add {selectedService?.name}</DialogTitle>
                        <DialogDescription>
                            Enter the price charged for this service, as in the
                            original POS workflow.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="service-price">Price</Label>
                            <Input
                                id="service-price"
                                type="number"
                                min={0.01}
                                step="0.01"
                                value={servicePrice || ''}
                                onChange={(event) =>
                                    setServicePrice(
                                        Math.max(0, Number(event.target.value)),
                                    )
                                }
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="service-quantity">Quantity</Label>
                            <Input
                                id="service-quantity"
                                type="number"
                                min={1}
                                max={999}
                                value={serviceQuantity}
                                onChange={(event) =>
                                    setServiceQuantity(
                                        Math.max(1, Number(event.target.value)),
                                    )
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setServiceDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={servicePrice <= 0}
                            onClick={addService}
                        >
                            <Plus /> Add to cart
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmCheckout} onOpenChange={setConfirmCheckout}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm payment</DialogTitle>
                        <DialogDescription>
                            Complete this sale for{' '}
                            {customerName || 'the customer'}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border bg-muted/20 p-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Payment
                            </span>
                            <span className="font-medium uppercase">
                                {paymentMethod}
                            </span>
                        </div>
                        <div className="mt-2 flex justify-between text-lg font-semibold">
                            <span>Total</span>
                            <span>{currency.format(total)}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmCheckout(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={checkoutSale}
                            disabled={checkoutProcessing}
                        >
                            <WalletCards />{' '}
                            {checkoutProcessing
                                ? 'Processing…'
                                : 'Complete payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SaleDetailsDialog
                sale={selectedSale}
                open={saleDialogOpen}
                onOpenChange={setSaleDialogOpen}
            />
            <ExpenseDialog
                key={`${filters.branch_ID}-${expenseCategories.length}`}
                open={expenseDialogOpen}
                onOpenChange={setExpenseDialogOpen}
                branches={branches}
                categories={expenseCategories}
                selectedBranchId={filters.branch_ID}
            />
            <ExpenseCategoryDialog
                open={categoryDialogOpen}
                onOpenChange={setCategoryDialogOpen}
            />
        </>
    );
}

function CatalogGrid({
    items,
    type,
    onAdd,
}: {
    items: PosProduct[] | PosService[];
    type: 'product' | 'service';
    onAdd: ((item: PosProduct) => void) | ((item: PosService) => void);
}) {
    if (items.length === 0) {
        return (
            <div className="flex min-h-96 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                {type === 'product' ? (
                    <ShoppingBag className="size-12" />
                ) : (
                    <Sparkles className="size-12" />
                )}
                <p className="font-medium">
                    No {type === 'product' ? 'products' : 'services'} found
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {items.map((item) => {
                const isProduct = type === 'product';
                const product = isProduct ? (item as PosProduct) : null;
                const service = !isProduct ? (item as PosService) : null;
                const id = product?.product_ID ?? service?.service_ID;

                return (
                    <article
                        key={`${type}-${id}`}
                        className="group flex min-h-64 flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/40">
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
                                    alt=""
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <ImageIcon className="size-10 text-muted-foreground" />
                            )}
                            <span className="absolute top-2 left-2 rounded-full border bg-background/90 px-2 py-0.5 text-[10px] font-medium">
                                {product?.status ??
                                    service?.category ??
                                    'Service'}
                            </span>
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-3">
                            <div>
                                <h3 className="line-clamp-2 text-sm font-semibold">
                                    {item.name}
                                </h3>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                    {product
                                        ? `${product.measurement_unit} · ${product.quantity} available`
                                        : service?.description ||
                                          service?.category}
                                </p>
                            </div>
                            <p className="mt-3 border-t pt-2 text-base font-bold text-primary">
                                {product
                                    ? currency.format(Number(product.price))
                                    : 'Custom price'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                            onClick={() => {
                                if (isProduct) {
                                    (onAdd as (item: PosProduct) => void)(
                                        item as PosProduct,
                                    );
                                } else {
                                    (onAdd as (item: PosService) => void)(
                                        item as PosService,
                                    );
                                }
                            }}
                        >
                            Add to cart
                        </button>
                    </article>
                );
            })}
        </div>
    );
}

function DailySales({
    sales,
    summary,
    date,
    onDateChange,
    onView,
}: {
    sales: PosSale[];
    summary: PosIndexProps['dailySummary'];
    date: string;
    onDateChange: (date: string) => void;
    onView: (sale: PosSale) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">Net sales</p>
                    <p className="text-3xl font-semibold">
                        {currency.format(summary.net)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Gross {currency.format(summary.gross)} · Returns{' '}
                        {currency.format(summary.returned)} · Voided{' '}
                        {currency.format(summary.voided)}
                    </p>
                </div>
                <Input
                    type="date"
                    value={date}
                    onChange={(event) => onDateChange(event.target.value)}
                    className="w-full sm:w-44"
                />
            </div>
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-2xl text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground uppercase">
                        <tr>
                            <th className="px-3 py-3">Customer</th>
                            <th className="px-3 py-3">Items</th>
                            <th className="px-3 py-3">Time</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3 text-right">Amount</th>
                            <th className="px-3 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sales.map((sale) => (
                            <tr
                                key={sale.sale_ID}
                                className="hover:bg-muted/30"
                            >
                                <td className="px-3 py-3">
                                    <p className="font-medium">
                                        {sale.customer_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {sale.invoice_number}
                                    </p>
                                </td>
                                <td className="px-3 py-3">
                                    {sale.total_items}
                                </td>
                                <td className="px-3 py-3">
                                    {new Intl.DateTimeFormat('en-PH', {
                                        timeStyle: 'short',
                                    }).format(new Date(sale.created_at))}
                                </td>
                                <td className="px-3 py-3">
                                    <span className="rounded-full border px-2 py-1 text-xs">
                                        {sale.is_voided
                                            ? 'Voided'
                                            : Number(sale.total_returned) > 0
                                              ? 'Returned'
                                              : 'Completed'}
                                    </span>
                                </td>
                                <td className="px-3 py-3 text-right font-medium">
                                    {currency.format(Number(sale.net_total))}
                                </td>
                                <td className="px-3 py-3 text-right">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onView(sale)}
                                    >
                                        <Eye />
                                        <span className="sr-only">
                                            View sale
                                        </span>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sales.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                        <ReceiptText className="size-10" />
                        <p>No sales for this date.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Expenses({
    expenses,
    summary,
    filters,
    onFiltersChange,
    onAdd,
    onAddCategory,
}: {
    expenses: PosExpense[];
    summary: PosIndexProps['expenseSummary'];
    filters: PosFilters;
    onFiltersChange: (changes: Partial<PosFilters>) => void;
    onAdd: () => void;
    onAddCategory: () => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Monthly expenses
                    </p>
                    <p className="text-3xl font-semibold">
                        {currency.format(summary.total)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {summary.count} recorded expenses
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select
                        value={String(filters.expense_month)}
                        onValueChange={(value) =>
                            onFiltersChange({ expense_month: Number(value) })
                        }
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from(
                                { length: 12 },
                                (_, index) => index + 1,
                            ).map((month) => (
                                <SelectItem key={month} value={String(month)}>
                                    {new Intl.DateTimeFormat('en', {
                                        month: 'long',
                                    }).format(new Date(2026, month - 1, 1))}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        min={2000}
                        max={2100}
                        value={filters.expense_year}
                        onChange={(event) =>
                            onFiltersChange({
                                expense_year: Number(event.target.value),
                            })
                        }
                        className="w-28"
                    />
                    <Button variant="outline" onClick={onAddCategory}>
                        <Tags /> Category
                    </Button>
                    <Button onClick={onAdd}>
                        <Plus /> Add expense
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-3xl text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground uppercase">
                        <tr>
                            <th className="px-3 py-3">Description</th>
                            <th className="px-3 py-3">Category</th>
                            <th className="px-3 py-3">Date</th>
                            <th className="px-3 py-3">Staff</th>
                            <th className="px-3 py-3 text-right">Amount</th>
                            <th className="px-3 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {expenses.map((expense) => (
                            <tr
                                key={expense.expense_ID}
                                className="hover:bg-muted/30"
                            >
                                <td className="px-3 py-3 font-medium">
                                    {expense.description}
                                </td>
                                <td className="px-3 py-3">
                                    {expense.category}
                                </td>
                                <td className="px-3 py-3">
                                    {new Intl.DateTimeFormat('en-PH', {
                                        dateStyle: 'medium',
                                    }).format(
                                        new Date(
                                            `${expense.expense_date}T00:00:00`,
                                        ),
                                    )}
                                </td>
                                <td className="px-3 py-3">
                                    {expense.created_by}
                                </td>
                                <td className="px-3 py-3 text-right font-medium">
                                    {currency.format(Number(expense.amount))}
                                </td>
                                <td className="px-3 py-3 text-right">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    `Remove ${expense.description}?`,
                                                )
                                            ) {
                                                router.delete(
                                                    destroyExpense.url(
                                                        expense.expense_ID,
                                                    ),
                                                    { preserveScroll: true },
                                                );
                                            }
                                        }}
                                    >
                                        <Trash2 />
                                        <span className="sr-only">
                                            Delete expense
                                        </span>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {expenses.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                        <ShoppingBag className="size-10" />
                        <p>No expenses for this period.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

PosIndex.layout = {
    breadcrumbs: [{ title: 'Point of Sale', href: index() }],
};
