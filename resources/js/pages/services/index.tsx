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
import Heading from '@/components/heading';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
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
import { ServicePagination } from './components/service-pagination';

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

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                index.url(),
                {
                    search: search || undefined,
                    per_page: filters.per_page,
                },
                {
                    only: ['services', 'filters'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters.per_page, filters.search, search]);

    const openServiceDialog = (
        mode: ServiceDialogMode,
        service: ClinicService | null = null,
    ) => {
        setDialogMode(mode);
        setSelectedService(service);
        setDialogOpen(true);
    };

    const openDeleteDialog = (service: ClinicService) => {
        setServiceToDelete(service);
        setDeleteDialogOpen(true);
    };

    const changePerPage = (value: string) => {
        router.get(
            index.url(),
            {
                search: filters.search || undefined,
                per_page: Number(value),
            },
            {
                only: ['services', 'filters'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
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

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
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

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Rows</span>
                            <Select
                                value={String(filters.per_page)}
                                onValueChange={changePerPage}
                            >
                                <SelectTrigger
                                    className="w-20"
                                    aria-label="Rows per page"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-3xl text-sm">
                            <thead className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3">Service</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {services.data.map((service) => (
                                    <ClickableTableRow
                                        key={service.service_ID}
                                        accessibleLabel={`View ${service.name}`}
                                        onActivate={() =>
                                            openServiceDialog('view', service)
                                        }
                                    >
                                        <td className="px-4 py-3">
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
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            <span className="block font-medium text-foreground">
                                                {
                                                    service.category
                                                        .major_service_category
                                                        .name
                                                }
                                            </span>
                                            <span className="block text-xs">
                                                {service.category.category_name}
                                            </span>
                                        </td>
                                        <td className="max-w-md px-4 py-3 text-muted-foreground">
                                            <p className="line-clamp-2">
                                                {service.description}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
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
                                                        openDeleteDialog(
                                                            service,
                                                        )
                                                    }
                                                    aria-label={`Delete ${service.name}`}
                                                >
                                                    <Trash2 />
                                                </TooltipIconButton>
                                            </div>
                                        </td>
                                    </ClickableTableRow>
                                ))}
                            </tbody>
                        </table>

                        {services.data.length === 0 && (
                            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                                <Sparkles className="size-10 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        No services found
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {filters.search
                                            ? 'Try a different search term.'
                                            : 'Add the first clinic service to get started.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <ServicePagination services={services} filters={filters} />
                </Card>
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
