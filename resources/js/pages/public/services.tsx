import { Head, InfiniteScroll, Link, router } from '@inertiajs/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PublicPageTitle } from '@/components/public-page-title';
import { PublicSiteLayout } from '@/components/public-site-layout';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { login as patientLogin } from '@/routes/patient';
import { services as publicServices } from '@/routes/public';
import type { PublicService, SystemSettings } from '@/types';

type PublicServicePaginator = {
    data: PublicService[];
    total: number;
};

type PublicServiceCategory = {
    name: string;
    count: number;
};

type PublicMajorServiceCategory = PublicServiceCategory & {
    categories: PublicServiceCategory[];
};

type PublicServiceFilters = {
    major_category: string | null;
    category: string | null;
};

export default function PublicServices({
    settings,
    services,
    majorCategories,
    filters,
}: {
    settings: SystemSettings;
    services: PublicServicePaginator;
    majorCategories: PublicMajorServiceCategory[];
    filters: PublicServiceFilters;
}) {
    const selectedMajorCategory = filters.major_category;
    const selectedCategory = filters.category;
    const selectedMajorCategoryData = majorCategories.find(
        (majorCategory) => majorCategory.name === selectedMajorCategory,
    );
    const selectedServiceCategories =
        selectedMajorCategoryData?.categories ?? [];
    const totalServices = majorCategories.reduce(
        (total, majorCategory) => total + majorCategory.count,
        0,
    );
    const logoUrl = settings.business_logo_url ?? '/icons/default-logo.svg';
    const filterServices = (
        majorCategory: string | null,
        category: string | null,
    ) => {
        router.visit(
            publicServices({
                query: {
                    major_category: majorCategory,
                    category,
                },
            }),
            {
                only: ['services', 'filters'],
                reset: ['services'],
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <PublicSiteLayout settings={settings}>
            <Head title={settings.services_title} />
            <PublicPageTitle title={settings.services_title} />
            <section className="mx-auto w-full max-w-7xl overflow-hidden px-2 pt-0 pb-10 sm:px-6 sm:py-14 lg:px-8">
                <div className="grid w-full min-w-0 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
                    <div className="w-full min-w-0 lg:hidden">
                        <nav
                            className="-mx-2 flex min-w-0 [scrollbar-width:none] overflow-x-auto border-b border-foreground/10 px-2 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
                            aria-label="Major service categories"
                        >
                            <button
                                type="button"
                                onClick={() => filterServices(null, null)}
                                className={`relative shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${selectedMajorCategory === null ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                aria-pressed={selectedMajorCategory === null}
                            >
                                All treatments
                            </button>
                            {majorCategories.map((majorCategory) => {
                                return (
                                    <button
                                        key={majorCategory.name}
                                        type="button"
                                        onClick={() =>
                                            filterServices(
                                                majorCategory.name,
                                                null,
                                            )
                                        }
                                        className={`relative shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${selectedMajorCategory === majorCategory.name ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                        aria-pressed={
                                            selectedMajorCategory ===
                                            majorCategory.name
                                        }
                                    >
                                        {majorCategory.name}
                                    </button>
                                );
                            })}
                        </nav>

                        {selectedServiceCategories.length > 0 && (
                            <div
                                className="-mx-2 flex min-w-0 [scrollbar-width:none] gap-2 overflow-x-auto bg-muted/30 px-2 py-3 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
                                aria-label="Service subcategories"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        filterServices(
                                            selectedMajorCategory,
                                            null,
                                        )
                                    }
                                    className={`shrink-0 rounded-md px-3 py-2 text-xs font-medium transition ${selectedCategory === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                    aria-pressed={selectedCategory === null}
                                >
                                    All
                                </button>
                                {selectedServiceCategories.map((category) => (
                                    <button
                                        key={category.name}
                                        type="button"
                                        onClick={() =>
                                            filterServices(
                                                selectedMajorCategory,
                                                category.name,
                                            )
                                        }
                                        className={`shrink-0 rounded-md px-3 py-2 text-xs font-medium transition ${selectedCategory === category.name ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                        aria-pressed={
                                            selectedCategory === category.name
                                        }
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="hidden h-fit border-r border-foreground/10 pr-6 lg:sticky lg:top-24 lg:block">
                        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                            Categories
                        </p>
                        <nav
                            className="mt-5 flex flex-col gap-2"
                            aria-label="Desktop service categories"
                        >
                            <button
                                type="button"
                                onClick={() => filterServices(null, null)}
                                className={`flex w-full items-center justify-between gap-4 rounded-md px-4 py-2 text-left text-sm transition ${selectedMajorCategory === null ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}
                                aria-pressed={selectedMajorCategory === null}
                            >
                                <span>All treatments</span>
                                <span className="text-xs opacity-70">
                                    {totalServices}
                                </span>
                            </button>
                            {majorCategories.map((majorCategory) => {
                                return (
                                    <div key={majorCategory.name}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                filterServices(
                                                    majorCategory.name,
                                                    null,
                                                )
                                            }
                                            className={`flex w-full items-center justify-between gap-4 rounded-md px-4 py-2 text-left text-sm transition ${selectedMajorCategory === majorCategory.name && selectedCategory === null ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}
                                            aria-pressed={
                                                selectedMajorCategory ===
                                                    majorCategory.name &&
                                                selectedCategory === null
                                            }
                                        >
                                            <span>{majorCategory.name}</span>
                                            <span className="text-xs opacity-70">
                                                {majorCategory.count}
                                            </span>
                                        </button>
                                        {selectedMajorCategory ===
                                            majorCategory.name &&
                                            selectedServiceCategories.length >
                                                0 && (
                                                <div className="mt-1 flex flex-col gap-1 pl-4">
                                                    {selectedServiceCategories.map(
                                                        (serviceCategory) => (
                                                            <button
                                                                key={
                                                                    serviceCategory.name
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    filterServices(
                                                                        selectedMajorCategory,
                                                                        serviceCategory.name,
                                                                    )
                                                                }
                                                                className={`rounded-md px-3 py-1.5 text-left text-xs transition ${selectedCategory === serviceCategory.name ? 'bg-primary/15 font-semibold text-primary' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}
                                                                aria-pressed={
                                                                    selectedCategory ===
                                                                    serviceCategory.name
                                                                }
                                                            >
                                                                {
                                                                    serviceCategory.name
                                                                }
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                );
                            })}
                        </nav>
                    </aside>

                    <div className="mt-8 min-w-0 lg:mt-0">
                        <div className="mb-8 flex flex-col items-start gap-3 border-b border-foreground/10 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                    {selectedCategory ??
                                        selectedMajorCategory ??
                                        'All treatments'}
                                </p>
                                <h2 className="mt-2 font-serif text-2xl leading-tight italic sm:text-4xl">
                                    Care designed for you.
                                </h2>
                            </div>
                            <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                                {services.total} treatments
                            </p>
                        </div>

                        <InfiniteScroll
                            data="services"
                            buffer={400}
                            preserveUrl
                            className="grid w-full min-w-0 grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
                            loading={
                                <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                                    Loading more treatments...
                                </p>
                            }
                        >
                            {services.data.map((service) => (
                                <article
                                    key={service.id}
                                    className="group flex min-w-0 flex-col overflow-hidden rounded-md bg-card shadow-sm transition duration-300 hover:shadow-xl"
                                >
                                    <figure className="flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-primary/5">
                                        <img
                                            src={service.image_url ?? logoUrl}
                                            alt={service.name}
                                            className={
                                                service.image_url
                                                    ? 'size-full object-cover transition duration-500 group-hover:scale-110'
                                                    : 'size-20 object-contain'
                                            }
                                            loading="lazy"
                                        />
                                    </figure>
                                    <div className="flex min-w-0 flex-1 flex-col space-y-0.5 p-2 sm:space-y-1 sm:p-3">
                                        {/* <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                            {service.major_category}
                                        </p> */}

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <h3
                                                    className="w-full truncate rounded-sm font-serif text-xs leading-4 italic outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:text-base sm:leading-6"
                                                    tabIndex={0}
                                                >
                                                    {service.name}
                                                </h3>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                className="max-w-[calc(100vw-2rem)] text-center sm:max-w-xs"
                                            >
                                                {service.name}
                                            </TooltipContent>
                                        </Tooltip>
                                        {/* <p className="text-xs text-muted-foreground">
                                            {service.category}
                                        </p> */}
                                        <CollapsibleDescription
                                            description={service.description}
                                        />
                                    </div>
                                    <Link
                                        href={patientLogin()}
                                        className="inline-flex h-9 w-full items-center justify-center gap-1 bg-primary px-2 text-[0.7rem] font-semibold text-primary-foreground transition hover:brightness-110 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
                                    >
                                        Book now{' '}
                                        <ArrowRight className="size-3.5 sm:size-4" />
                                    </Link>
                                </article>
                            ))}
                        </InfiniteScroll>
                        {services.total === 0 && (
                            <div
                                role="status"
                                className="relative mx-auto mt-12 flex w-64 justify-center pt-16 sm:w-72"
                            >
                                <span
                                    aria-hidden="true"
                                    className="absolute top-0 left-[46%] h-16 w-px -rotate-12 bg-black"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute top-1 left-[52%] h-14 w-px rotate-12 bg-black"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute top-7 left-1/2 z-10 size-20 -translate-x-1/2 rounded-full bg-primary shadow-md"
                                >
                                    <span className="absolute top-5 left-1/2 size-4 -translate-x-1/2 rounded-full bg-black" />
                                </span>
                                <div className="relative flex min-h-72 w-full flex-col items-center justify-center border border-primary/30 bg-[#ede1b9] px-6 pt-24 pb-8 text-center text-foreground shadow-xl">
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-7 left-4 h-px w-5 -rotate-12 bg-primary/70"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-12 left-7 h-px w-4 -rotate-45 bg-primary/70"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-16 left-4 h-px w-5 rotate-12 bg-primary/70"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-7 right-4 h-px w-5 rotate-12 bg-primary/70"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-12 right-7 h-px w-4 rotate-45 bg-primary/70"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-16 right-4 h-px w-5 -rotate-12 bg-primary/70"
                                    />
                                    <p className="font-serif text-2xl font-bold tracking-wide text-primary uppercase">
                                        Available
                                    </p>
                                    <p className="mt-1 text-5xl leading-none font-light text-primary italic sm:text-6xl">
                                        Soon
                                    </p>
                                    <p className="mt-2 font-serif text-2xl italic">
                                        Stay tuned
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </PublicSiteLayout>
    );
}

function CollapsibleDescription({ description }: { description: string }) {
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);

    useEffect(() => {
        const element = descriptionRef.current;

        if (!element || isExpanded) {
            return;
        }

        const updateCanExpand = () => {
            setCanExpand(element.scrollHeight > element.clientHeight + 1);
        };

        updateCanExpand();

        const resizeObserver = new ResizeObserver(updateCanExpand);
        resizeObserver.observe(element);

        return () => resizeObserver.disconnect();
    }, [description, isExpanded]);

    return (
        <div className="flex flex-1 flex-col pt-1">
            <p
                ref={descriptionRef}
                className={`${isExpanded ? 'line-clamp-none' : 'line-clamp-1'} text-left text-[0.7rem] leading-4 text-muted-foreground sm:text-sm sm:leading-5`}
            >
                {description}
            </p>
            {canExpand && (
                <button
                    type="button"
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                    className="mt-1.5 inline-flex w-fit items-center gap-0.5 text-[0.7rem] font-semibold text-primary transition hover:brightness-75 sm:mt-2 sm:gap-1 sm:text-xs"
                    aria-expanded={isExpanded}
                >
                    {isExpanded ? 'Show less' : 'Show more'}
                    <ChevronDown
                        className={`size-3 transition-transform sm:size-3.5 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </button>
            )}
        </div>
    );
}
