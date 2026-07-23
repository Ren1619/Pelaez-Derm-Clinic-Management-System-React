import { Head, Link, router } from '@inertiajs/react';
import {
    Ban,
    Boxes,
    CheckCircle2,
    Clock3,
    ListTree,
    Plus,
    Search,
    Tags,
    TriangleAlert,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import { DataTableLayout } from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index as categoriesIndex } from '@/routes/categories';
import { index } from '@/routes/inventory';
import { isProductGroup } from '@/types';
import type {
    InventoryBranchOption,
    InventoryCategoryOption,
    InventoryFilters,
    InventoryPaginator,
    InventoryStatistics,
    InventoryStatus,
    ProductBatch,
    ProductDialogMode,
    ProductGroup,
} from '@/types';
import { DetailedInventoryTable } from './components/detailed-inventory-table';
import { GroupedInventoryTable } from './components/grouped-inventory-table';
import { ProductDeleteDialog } from './components/product-delete-dialog';
import { ProductDialog } from './components/product-dialog';

type InventoryIndexProps = {
    inventory: InventoryPaginator;
    filters: InventoryFilters;
    statistics: InventoryStatistics;
    branches: InventoryBranchOption[];
    mainBranch: InventoryBranchOption | null;
    categories: InventoryCategoryOption[];
};

const statusTabs: Array<{ value: InventoryStatus; label: string }> = [
    { value: 'in-stock', label: 'In stock' },
    { value: 'low-stock', label: 'Low stock' },
    { value: 'out-of-stock', label: 'Out of stock' },
    { value: 'expiring', label: 'Expiring' },
    { value: 'expired', label: 'Expired' },
];

export default function InventoryIndex({
    inventory,
    filters,
    statistics,
    branches,
    mainBranch,
    categories,
}: InventoryIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('action') ===
                'create',
    );
    const [dialogMode, setDialogMode] = useState<ProductDialogMode>('create');
    const [selectedProduct, setSelectedProduct] = useState<ProductBatch | null>(
        null,
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<ProductBatch | null>(
        null,
    );

    const visitInventory = (
        changes: Partial<InventoryFilters>,
        options: { replace?: boolean } = {},
    ) => {
        const nextFilters = { ...filters, ...changes };

        router.get(
            index.url(),
            {
                status: nextFilters.status,
                view: nextFilters.view,
                search: nextFilters.search || undefined,
                branch_ID: nextFilters.branch_ID ?? undefined,
                per_page: nextFilters.per_page,
            },
            {
                only: ['inventory', 'filters', 'statistics'],
                preserveState: true,
                preserveScroll: true,
                replace: options.replace ?? true,
            },
        );
    };

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                index.url(),
                {
                    status: filters.status,
                    view: filters.view,
                    search: search || undefined,
                    branch_ID: filters.branch_ID ?? undefined,
                    per_page: filters.per_page,
                },
                {
                    only: ['inventory', 'filters', 'statistics'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [
        filters.branch_ID,
        filters.per_page,
        filters.search,
        filters.status,
        filters.view,
        search,
    ]);

    const openProductDialog = (
        mode: ProductDialogMode,
        product: ProductBatch | null = null,
    ) => {
        setDialogMode(mode);
        setSelectedProduct(product);
        setDialogOpen(true);
    };

    const openDeleteDialog = (product: ProductBatch) => {
        setProductToDelete(product);
        setDeleteDialogOpen(true);
    };

    const groupedProducts = inventory.data.filter(isProductGroup);
    const detailedProducts = inventory.data.filter(
        (item): item is ProductBatch => !isProductGroup(item),
    );

    return (
        <>
            <Head title="Inventory" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title="Inventory"
                        description="Track product stock, prices, branches, batches, and expiration dates."
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link
                                href={categoriesIndex({
                                    query: { tab: 'products' },
                                })}
                            >
                                <Tags /> Product categories
                            </Link>
                        </Button>
                        <Button onClick={() => openProductDialog('create')}>
                            <Plus /> Add product
                        </Button>
                    </div>
                </div>

                <InventoryStatisticCards statistics={statistics} />

                <DataTableLayout>
                    <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:flex-wrap xl:items-center xl:justify-start">
                        <div className="relative w-full xl:max-w-sm">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search product, category, or branch..."
                                className="pl-9"
                                aria-label="Search inventory"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={filters.branch_ID?.toString() ?? 'all'}
                                onValueChange={(value) =>
                                    visitInventory({
                                        branch_ID:
                                            value === 'all'
                                                ? null
                                                : Number(value),
                                    })
                                }
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="All branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All branches
                                    </SelectItem>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.branch_ID}
                                            value={branch.branch_ID.toString()}
                                        >
                                            {branch.branch_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={() =>
                                    visitInventory({
                                        view:
                                            filters.view === 'grouped'
                                                ? 'detailed'
                                                : 'grouped',
                                    })
                                }
                            >
                                <ListTree />
                                {filters.view === 'grouped'
                                    ? 'Detailed view'
                                    : 'Grouped view'}
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto border-b px-4">
                        <nav
                            className="flex min-w-max gap-2"
                            aria-label="Stock status"
                        >
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() =>
                                        visitInventory({ status: tab.value })
                                    }
                                    className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                                        filters.status === tab.value
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {filters.view === 'grouped' ? (
                        <GroupedInventoryTable
                            groups={groupedProducts as ProductGroup[]}
                            emptyState={
                                <DataTableEmptyState
                                    colSpan={10}
                                    icon={
                                        <Boxes className="size-10 text-muted-foreground" />
                                    }
                                    title="No inventory found"
                                    description={
                                        filters.search
                                            ? 'Try a different search term or stock filter.'
                                            : 'There are no products in this stock status.'
                                    }
                                />
                            }
                            onView={(product) =>
                                openProductDialog('view', product)
                            }
                            onEdit={(product) =>
                                openProductDialog('edit', product)
                            }
                            onRestock={(product) =>
                                openProductDialog('restock', product)
                            }
                            onDelete={openDeleteDialog}
                        />
                    ) : (
                        <DetailedInventoryTable
                            products={detailedProducts}
                            emptyState={
                                <DataTableEmptyState
                                    colSpan={9}
                                    icon={
                                        <Boxes className="size-10 text-muted-foreground" />
                                    }
                                    title="No inventory found"
                                    description={
                                        filters.search
                                            ? 'Try a different search term or stock filter.'
                                            : 'There are no products in this stock status.'
                                    }
                                />
                            }
                            onView={(product) =>
                                openProductDialog('view', product)
                            }
                            onEdit={(product) =>
                                openProductDialog('edit', product)
                            }
                            onRestock={(product) =>
                                openProductDialog('restock', product)
                            }
                            onDelete={openDeleteDialog}
                        />
                    )}

                    <DataTablePagination
                        paginator={inventory}
                        itemLabel={
                            filters.view === 'grouped' ? 'products' : 'batches'
                        }
                        onPageChange={(page) =>
                            router.get(
                                index.url(),
                                { ...filters, page },
                                {
                                    only: ['inventory', 'filters'],
                                    preserveState: true,
                                    preserveScroll: true,
                                },
                            )
                        }
                        onPerPageChange={(perPage) =>
                            visitInventory({ per_page: perPage })
                        }
                    />
                </DataTableLayout>
            </div>

            <ProductDialog
                key={`${dialogMode}-${selectedProduct?.product_ID ?? 'new'}`}
                product={selectedProduct}
                categories={categories}
                mainBranch={mainBranch}
                mode={dialogMode}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <ProductDeleteDialog
                product={productToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

function InventoryStatisticCards({
    statistics,
}: {
    statistics: InventoryStatistics;
}) {
    const cards = [
        {
            label: 'Total products',
            value: statistics.total,
            icon: Boxes,
        },
        {
            label: 'In stock',
            value: statistics.in_stock,
            icon: CheckCircle2,
        },
        {
            label: 'Low stock',
            value: statistics.low_stock,
            icon: TriangleAlert,
        },
        {
            label: 'Out of stock',
            value: statistics.out_of_stock,
            icon: Ban,
        },
        {
            label: 'Expiring',
            value: statistics.expiring,
            icon: Clock3,
        },
        {
            label: 'Expired',
            value: statistics.expired,
            icon: TriangleAlert,
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {cards.map((card) => (
                <Card key={card.label} className="gap-3 py-4">
                    <CardHeader className="flex flex-row items-center justify-between px-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            {card.label}
                        </span>
                        <card.icon className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4">
                        <p className="text-3xl font-semibold">{card.value}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Inventory',
            href: index(),
        },
    ],
};
