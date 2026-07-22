import { Head, router } from '@inertiajs/react';
import {
    Package,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Tags,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import {
    DataTableLayout,
    DataTableToolbar,
} from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index } from '@/routes/categories';
import type {
    Category,
    CategoryFilters,
    CategoryPaginator,
    CategorySummary,
    CategoryType,
} from '@/types';
import { CategoryDeleteDialog } from './components/category-delete-dialog';
import { CategoryDialog } from './components/category-dialog';

type CategoriesIndexProps = {
    categories: CategoryPaginator;
    filters: CategoryFilters;
    summary: CategorySummary;
};

export default function CategoriesIndex({
    categories,
    filters,
    summary,
}: CategoriesIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null,
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
        null,
    );

    const categoryType: CategoryType =
        filters.tab === 'products' ? 'Product' : 'Service';

    const visitWithFilters = (nextFilters: Partial<CategoryFilters>) => {
        const next = { ...filters, ...nextFilters };

        router.get(
            index.url(),
            {
                tab: next.tab,
                search: next.search || undefined,
                per_page: next.per_page,
            },
            {
                only: ['categories', 'filters'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            visitWithFilters({ search });
        }, 350);

        return () => window.clearTimeout(timeout);
        // The current server-side filters intentionally define the next visit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters.search]);

    const changeTab = (tab: CategoryFilters['tab']) => {
        visitWithFilters({ tab });
    };

    const openCreateDialog = () => {
        setSelectedCategory(null);
        setDialogOpen(true);
    };

    const openEditDialog = (category: Category) => {
        setSelectedCategory(category);
        setDialogOpen(true);
    };

    const openDeleteDialog = (category: Category) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Categories" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Categories"
                        description="Organize the product catalog and clinic service offerings."
                    />
                    <Button onClick={openCreateDialog}>
                        <Plus /> Add {categoryType.toLowerCase()} category
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <SummaryCard
                        label="Product categories"
                        value={summary.products}
                        icon={<Package className="size-4" />}
                    />
                    <SummaryCard
                        label="Service categories"
                        value={summary.services}
                        icon={<Sparkles className="size-4" />}
                    />
                </div>

                <DataTableLayout
                    toolbar={
                        <DataTableToolbar>
                            <div
                                role="tablist"
                                aria-label="Category type"
                                className="inline-flex w-fit rounded-lg bg-muted p-1"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={filters.tab === 'products'}
                                    onClick={() => changeTab('products')}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        filters.tab === 'products'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Product categories
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={filters.tab === 'services'}
                                    onClick={() => changeTab('services')}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        filters.tab === 'services'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Service categories
                                </button>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search categories..."
                                        className="pl-9"
                                        aria-label="Search categories"
                                    />
                                </div>
                            </div>
                        </DataTableToolbar>
                    }
                    footer={
                        <DataTablePagination
                            paginator={categories}
                            itemLabel="categories"
                            onPageChange={(page) =>
                                router.get(
                                    index.url(),
                                    { ...filters, page },
                                    {
                                        only: ['categories', 'filters'],
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                )
                            }
                            onPerPageChange={(perPage) =>
                                visitWithFilters({ per_page: perPage })
                            }
                        />
                    }
                >
                    <Table className="min-w-2xl">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">#</TableHead>
                                <TableHead>Category name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.data.map((category, index) => (
                                <TableRow key={category.category_ID}>
                                    <TableCell className="text-muted-foreground">
                                        {(categories.current_page - 1) *
                                            categories.per_page +
                                            index +
                                            1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Tags className="size-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {category.category_name}
                                            </span>
                                            <Badge variant="outline">
                                                {category.category_type}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xl text-muted-foreground">
                                        <p className="line-clamp-2">
                                            {category.description}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                tooltip={`Edit ${category.category_name}`}
                                                onClick={() =>
                                                    openEditDialog(category)
                                                }
                                                aria-label={`Edit ${category.category_name}`}
                                            >
                                                <Pencil />
                                            </TooltipIconButton>
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                tooltip={`Delete ${category.category_name}`}
                                                onClick={() =>
                                                    openDeleteDialog(category)
                                                }
                                                aria-label={`Delete ${category.category_name}`}
                                            >
                                                <Trash2 />
                                            </TooltipIconButton>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {categories.data.length === 0 && (
                                <DataTableEmptyState
                                    colSpan={4}
                                    icon={
                                        <Tags className="size-10 text-muted-foreground" />
                                    }
                                    title={`No ${categoryType.toLowerCase()} categories found`}
                                    description={
                                        filters.search
                                            ? 'Try a different search term.'
                                            : `Add the first ${categoryType.toLowerCase()} category to get started.`
                                    }
                                />
                            )}
                        </TableBody>
                    </Table>
                </DataTableLayout>
            </div>

            <CategoryDialog
                key={`${selectedCategory?.category_ID ?? 'new'}-${categoryType}`}
                category={selectedCategory}
                categoryType={categoryType}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
            <CategoryDeleteDialog
                key={categoryToDelete?.category_ID ?? 'none'}
                category={categoryToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

function SummaryCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: ReactNode;
}) {
    return (
        <Card className="gap-3 py-4">
            <CardHeader className="flex flex-row items-center justify-between px-4 text-muted-foreground">
                <span className="text-sm font-medium">{label}</span>
                {icon}
            </CardHeader>
            <CardContent className="px-4">
                <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: index(),
        },
    ],
};
