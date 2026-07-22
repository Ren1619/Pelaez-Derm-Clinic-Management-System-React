import { Head, router } from '@inertiajs/react';
import {
    Eye,
    CalendarIcon,
    ImageIcon,
    Info,
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
import { ClickableTableRow } from '@/components/clickable-table-row';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import { DataTableLayout } from '@/components/data-table-layout';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { ProductDetailsDialog } from './components/product-details-dialog';
import { SaleDetailsDialog } from './components/sale-details-dialog';
import { ServiceDetailsDialog } from './components/service-details-dialog';

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

/** Parses an ISO date without shifting it across timezones. */
function parseIsoDate(date: string): Date | undefined {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    return match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : undefined;
}

/** Formats a date for the Daily Sales filter. */
function formatLongDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

/** Formats a selected calendar date for the POS query string. */
function formatIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

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
    const [serviceDetailsOpen, setServiceDetailsOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<PosSale | null>(null);
    const [saleDialogOpen, setSaleDialogOpen] = useState(false);
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(
        null,
    );
    const [productDetailsOpen, setProductDetailsOpen] = useState(false);

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
                                onViewProduct={(product) => {
                                    setSelectedProduct(product);
                                    setProductDetailsOpen(true);
                                }}
                            />
                        )}
                        {activeTab === 'services' && (
                            <CatalogGrid
                                items={filteredServices}
                                type="service"
                                onAdd={openServiceDialog}
                                onViewService={(service) => {
                                    setSelectedService(service);
                                    setServiceDetailsOpen(true);
                                }}
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
                    <p className="text-sm text-foreground">
                        All fields with{' '}
                        <span className="text-primary" aria-hidden="true">
                            *
                        </span>{' '}
                        are required.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="service-price">
                                Price
                                <span
                                    className="text-primary"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </Label>
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
                            <Label htmlFor="service-quantity">
                                Quantity
                                <span
                                    className="text-primary"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </Label>
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
            <ProductDetailsDialog
                product={selectedProduct}
                branchName={
                    branches.find(
                        (branch) => branch.branch_ID === filters.branch_ID,
                    )?.branch_name ?? 'Selected branch'
                }
                open={productDetailsOpen}
                onOpenChange={setProductDetailsOpen}
            />
            <ServiceDetailsDialog
                service={selectedService}
                open={serviceDetailsOpen}
                onOpenChange={setServiceDetailsOpen}
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
    onViewProduct,
    onViewService,
}: {
    items: PosProduct[] | PosService[];
    type: 'product' | 'service';
    onAdd: ((item: PosProduct) => void) | ((item: PosService) => void);
    onViewProduct?: (product: PosProduct) => void;
    onViewService?: (service: PosService) => void;
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => {
                const isProduct = type === 'product';

                if (isProduct) {
                    const product = item as PosProduct;

                    return (
                        <article
                            key={`product-${product.product_ID}`}
                            className="group relative aspect-square overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <button
                                type="button"
                                className="absolute inset-0 block h-full w-full bg-card text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                                onClick={() =>
                                    (onAdd as (item: PosProduct) => void)(
                                        product,
                                    )
                                }
                                aria-label={`Add ${product.name} to cart`}
                            >
                                <span className="absolute inset-0 flex items-center justify-center bg-muted/40 p-2">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <ImageIcon className="size-14 text-muted-foreground" />
                                    )}
                                </span>
                                <span className="absolute inset-0 flex min-w-0 flex-col justify-end bg-linear-to-t from-background via-background/60 to-transparent px-3 pb-3">
                                    <span
                                        className="block truncate text-sm leading-tight font-semibold text-foreground"
                                        title={product.name}
                                    >
                                        {product.name}
                                    </span>
                                    <span className="mt-1 flex min-w-0 items-end justify-between gap-2">
                                        <span
                                            className="min-w-0 truncate text-xs text-muted-foreground"
                                            title={`${product.quantity} ${product.measurement_unit} available`}
                                        >
                                            {product.quantity}{' '}
                                            {product.measurement_unit} available
                                        </span>
                                        <span
                                            className="shrink-0 text-xs font-bold text-primary"
                                            title={currency.format(
                                                Number(product.price),
                                            )}
                                        >
                                            {currency.format(
                                                Number(product.price),
                                            )}
                                        </span>
                                    </span>
                                </span>
                            </button>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                        onClick={() => onViewProduct?.(product)}
                                        aria-label={`View information for ${product.name}`}
                                    >
                                        <Info className="size-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    View information for {product.name}
                                </TooltipContent>
                            </Tooltip>
                        </article>
                    );
                }

                const service = item as PosService;

                return (
                    <article
                        key={`service-${service.service_ID}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <button
                            type="button"
                            className="absolute inset-0 block h-full w-full bg-card text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                            onClick={() =>
                                (onAdd as (item: PosService) => void)(service)
                            }
                            aria-label={`Add ${service.name} to cart`}
                        >
                            <span className="absolute inset-0 flex items-center justify-center bg-muted/40 p-2">
                                {service.image_url ? (
                                    <img
                                        src={service.image_url}
                                        alt={service.name}
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <ImageIcon className="size-14 text-muted-foreground" />
                                )}
                            </span>
                            <span className="absolute inset-0 flex min-w-0 flex-col justify-end bg-linear-to-t from-background via-background/60 to-transparent px-3 pb-3">
                                <span
                                    className="block truncate text-sm leading-tight font-semibold text-foreground"
                                    title={service.name}
                                >
                                    {service.name}
                                </span>
                                <span className="mt-1 flex min-w-0 items-end justify-between gap-2">
                                    <span
                                        className="min-w-0 truncate text-xs text-muted-foreground"
                                        title={
                                            service.description ||
                                            service.category ||
                                            'Service'
                                        }
                                    >
                                        {service.description ||
                                            service.category ||
                                            'Service'}
                                    </span>
                                    <span className="shrink-0 text-xs font-bold text-primary">
                                        Custom price
                                    </span>
                                </span>
                            </span>
                        </button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="absolute top-2 right-2 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                    onClick={() => onViewService?.(service)}
                                    aria-label={`View information for ${service.name}`}
                                >
                                    <Info className="size-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                View information for {service.name}
                            </TooltipContent>
                        </Tooltip>
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
    const [calendarOpen, setCalendarOpen] = useState(false);
    const selectedDate = parseIsoDate(date);

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
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between font-normal sm:w-52"
                            aria-label="Select daily sales date"
                        >
                            <span>
                                {selectedDate
                                    ? formatLongDate(selectedDate)
                                    : 'June 10, 2026'}
                            </span>
                            <CalendarIcon className="size-4 text-muted-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0"
                        align="end"
                    >
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            defaultMonth={selectedDate}
                            onSelect={(selected) => {
                                if (!selected) {
                                    return;
                                }

                                onDateChange(formatIsoDate(selected));
                                setCalendarOpen(false);
                            }}
                            captionLayout="dropdown"
                            startMonth={new Date(2000, 0)}
                            endMonth={new Date()}
                            disabled={{ after: new Date() }}
                            autoFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <DataTableLayout>
                <Table className="min-w-2xl">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.map((sale) => (
                            <ClickableTableRow
                                key={sale.sale_ID}
                                accessibleLabel={`View invoice ${sale.invoice_number}`}
                                onActivate={() => onView(sale)}
                            >
                                <TableCell>
                                    <p className="font-medium">
                                        {sale.customer_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {sale.invoice_number}
                                    </p>
                                </TableCell>
                                <TableCell>{sale.total_items}</TableCell>
                                <TableCell>
                                    {new Intl.DateTimeFormat('en-PH', {
                                        timeStyle: 'short',
                                    }).format(new Date(sale.created_at))}
                                </TableCell>
                                <TableCell>
                                    <span className="rounded-full border px-2 py-1 text-xs">
                                        {sale.is_voided
                                            ? 'Voided'
                                            : Number(sale.total_returned) > 0
                                              ? 'Returned'
                                              : 'Completed'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {currency.format(Number(sale.net_total))}
                                </TableCell>
                            </ClickableTableRow>
                        ))}
                        {sales.length === 0 && (
                            <DataTableEmptyState
                                colSpan={5}
                                icon={
                                    <ReceiptText className="size-10 text-muted-foreground" />
                                }
                                title="No sales found"
                                description="No sales for this date."
                            />
                        )}
                    </TableBody>
                </Table>
            </DataTableLayout>
        </div>
    );
}

/** Displays a month-and-year-only filter without individual calendar dates. */
function ExpenseMonthYearFilter({
    month,
    year,
    onChange,
}: {
    month: number;
    year: number;
    onChange: (changes: Partial<PosFilters>) => void;
}) {
    const [open, setOpen] = useState(false);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const monthName = new Intl.DateTimeFormat('en-US', {
        month: 'long',
    }).format(new Date(year, month - 1, 1));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal sm:w-44"
                    aria-label="Select expense month and year"
                >
                    <span>
                        {monthName} {year}
                    </span>
                    <CalendarIcon className="size-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-72 max-w-[calc(100vw-2rem)] p-3"
                align="end"
            >
                <div className="grid gap-3">
                    <Select
                        value={String(year)}
                        onValueChange={(value) => {
                            const selectedYear = Number(value);

                            onChange({
                                expense_year: selectedYear,
                                // Prevent a future month when returning to the current year.
                                expense_month:
                                    selectedYear === currentYear
                                        ? Math.min(month, currentMonth)
                                        : month,
                            });
                        }}
                    >
                        <SelectTrigger
                            className="w-full"
                            aria-label="Expense year"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from(
                                { length: currentYear - 1999 },
                                (_, index) => currentYear - index,
                            ).map((yearOption) => (
                                <SelectItem
                                    key={yearOption}
                                    value={String(yearOption)}
                                >
                                    {yearOption}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="grid grid-cols-3 gap-1">
                        {Array.from(
                            { length: 12 },
                            (_, index) => index + 1,
                        ).map((monthOption) => {
                            const isFutureMonth =
                                year === currentYear &&
                                monthOption > currentMonth;

                            return (
                                <Button
                                    key={monthOption}
                                    type="button"
                                    size="sm"
                                    variant={
                                        monthOption === month
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    disabled={isFutureMonth}
                                    onClick={() => {
                                        onChange({
                                            expense_month: monthOption,
                                        });
                                        setOpen(false);
                                    }}
                                >
                                    {new Intl.DateTimeFormat('en-US', {
                                        month: 'short',
                                    }).format(
                                        new Date(2026, monthOption - 1, 1),
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
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
                    <ExpenseMonthYearFilter
                        month={filters.expense_month}
                        year={filters.expense_year}
                        onChange={onFiltersChange}
                    />
                    <Button variant="outline" onClick={onAddCategory}>
                        <Tags /> Category
                    </Button>
                    <Button onClick={onAdd}>
                        <Plus /> Add expense
                    </Button>
                </div>
            </div>
            <DataTableLayout>
                <Table className="min-w-3xl">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.expense_ID}>
                                <TableCell className="font-medium">
                                    {expense.description}
                                </TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell>
                                    {new Intl.DateTimeFormat('en-PH', {
                                        dateStyle: 'medium',
                                    }).format(
                                        new Date(
                                            `${expense.expense_date}T00:00:00`,
                                        ),
                                    )}
                                </TableCell>
                                <TableCell>{expense.created_by}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {currency.format(Number(expense.amount))}
                                </TableCell>
                                <TableCell className="text-right">
                                    <TooltipIconButton
                                        size="icon"
                                        variant="ghost"
                                        className="text-destructive"
                                        tooltip={`Delete ${expense.description}`}
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
                                    </TooltipIconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {expenses.length === 0 && (
                            <DataTableEmptyState
                                colSpan={6}
                                icon={
                                    <ShoppingBag className="size-10 text-muted-foreground" />
                                }
                                title="No expenses found"
                                description="No expenses for this period."
                            />
                        )}
                    </TableBody>
                </Table>
            </DataTableLayout>
        </div>
    );
}

PosIndex.layout = {
    breadcrumbs: [{ title: 'Point of Sale', href: index() }],
};
