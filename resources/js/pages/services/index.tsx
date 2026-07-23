import { Head, Link, router } from '@inertiajs/react';
import {
    ImageIcon,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Tags,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import {
    DataTableLayout,
    DataTableToolbar,
} from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import {
    markNewRecordSeen,
    NewRecordBadge,
    newRecordRowClass,
} from '@/components/new-record-indicator';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
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
import { index as categoriesIndex } from '@/routes/categories';
import { index } from '@/routes/services';
import type {
    ClinicService,
    ServiceCategoryOption,
    ServiceDialogMode,
    ServiceFilters,
    ServicePaginator,
} from '@/types';
import { ServiceDeleteDialog } from './components/service-delete-dialog';
import { ServiceDialog } from './components/service-dialog';

type ServicesIndexProps = {
    services: ServicePaginator;
    categories: ServiceCategoryOption[];
    filters: ServiceFilters;
    totalServices: number;
};

export default function ServicesIndex({
    services,
    categories,
    filters,
    totalServices,
}: ServicesIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('action') ===
                'create',
    );
    const [dialogMode, setDialogMode] = useState<ServiceDialogMode>('create');
    const [selectedService, setSelectedService] =
        useState<ClinicService | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] =
        useState<ClinicService | null>(null);

    const visitWithFilters = (
        nextFilters: Partial<ServiceFilters>,
        page?: number,
    ) => {
        const next = { ...filters, ...nextFilters };

        router.get(
            index.url(),
            {
                search: next.search || undefined,
                per_page: next.per_page,
                page,
            },
            {
                only: ['services', 'filters'],
                preserveState: true,
                preserveScroll: true,
                replace: page === undefined,
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

    const openServiceDialog = (
        mode: ServiceDialogMode,
        service: ClinicService | null = null,
    ) => {
        if (mode === 'view' && service !== null) {
            markNewRecordSeen(service, 'services');
        }

        setDialogMode(mode);
        setSelectedService(service);
        setDialogOpen(true);
    };

    const openDeleteDialog = (service: ClinicService) => {
        setServiceToDelete(service);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Services" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Services"
                        description="Manage clinic treatments, procedures, consultations, categories, and images."
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link
                                href={categoriesIndex({
                                    query: { tab: 'services' },
                                })}
                            >
                                <Tags /> Service categories
                            </Link>
                        </Button>
                        <Button onClick={() => openServiceDialog('create')}>
                            <Plus /> Add service
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="gap-3 py-4">
                        <CardHeader className="flex flex-row items-center justify-between px-4">
                            <span className="text-sm font-medium text-muted-foreground">
                                Total services
                            </span>
                            <Sparkles className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-4">
                            <p className="text-3xl font-semibold">
                                {totalServices}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <DataTableLayout
                    toolbar={
                        <DataTableToolbar>
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search service or category..."
                                    className="pl-9"
                                    aria-label="Search services"
                                />
                            </div>
                        </DataTableToolbar>
                    }
                    footer={
                        <DataTablePagination
                            paginator={services}
                            itemLabel="services"
                            onPageChange={(page) => visitWithFilters({}, page)}
                            onPerPageChange={(perPage) =>
                                visitWithFilters({ per_page: perPage })
                            }
                        />
                    }
                >
                    <Table className="min-w-3xl">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.data.map((service) => (
                                <ClickableTableRow
                                    key={service.service_ID}
                                    accessibleLabel={`View ${service.name}`}
                                    onActivate={() =>
                                        openServiceDialog('view', service)
                                    }
                                    className={newRecordRowClass(service)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {service.image_url ? (
                                                <img
                                                    src={service.image_url}
                                                    alt=""
                                                    className="size-11 rounded-md border object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-11 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                                                    <ImageIcon className="size-5" />
                                                </div>
                                            )}
                                            <span className="font-medium">
                                                {service.name}
                                            </span>
                                            {service.is_new && (
                                                <NewRecordBadge />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        <span className="block font-medium text-foreground">
                                            {
                                                service.category
                                                    .major_service_category.name
                                            }
                                        </span>
                                        <span className="block text-xs">
                                            {service.category.category_name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-md text-muted-foreground">
                                        <p className="line-clamp-2">
                                            {service.description}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                tooltip={`Edit ${service.name}`}
                                                onClick={() =>
                                                    openServiceDialog(
                                                        'edit',
                                                        service,
                                                    )
                                                }
                                                aria-label={`Edit ${service.name}`}
                                            >
                                                <Pencil />
                                            </TooltipIconButton>
                                            <TooltipIconButton
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                tooltip={`Delete ${service.name}`}
                                                onClick={() =>
                                                    openDeleteDialog(service)
                                                }
                                                aria-label={`Delete ${service.name}`}
                                            >
                                                <Trash2 />
                                            </TooltipIconButton>
                                        </div>
                                    </TableCell>
                                </ClickableTableRow>
                            ))}
                            {services.data.length === 0 && (
                                <DataTableEmptyState
                                    colSpan={4}
                                    icon={
                                        <Sparkles className="size-10 text-muted-foreground" />
                                    }
                                    title="No services found"
                                    description={
                                        filters.search
                                            ? 'Try a different search term.'
                                            : 'Add the first clinic service to get started.'
                                    }
                                />
                            )}
                        </TableBody>
                    </Table>
                </DataTableLayout>
            </div>

            <ServiceDialog
                key={`${dialogMode}-${selectedService?.service_ID ?? 'new'}`}
                service={selectedService}
                categories={categories}
                mode={dialogMode}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <ServiceDeleteDialog
                service={serviceToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

ServicesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Services',
            href: index(),
        },
    ],
};
