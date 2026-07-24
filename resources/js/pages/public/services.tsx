import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { PublicHero, PublicSiteLayout } from '@/components/public-site-layout';
import { login as patientLogin } from '@/routes/patient';
import type { PublicService, SystemSettings } from '@/types';

export default function PublicServices({
    settings,
    services,
    majorCategories,
}: {
    settings: SystemSettings;
    services: PublicService[];
    majorCategories: string[];
}) {
    const [selectedMajorCategory, setSelectedMajorCategory] = useState<
        string | null
    >(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null,
    );
    const displayedServices = services.filter(
        (service) =>
            (selectedMajorCategory === null ||
                service.major_category === selectedMajorCategory) &&
            (selectedCategory === null ||
                service.category === selectedCategory),
    );
    const logoUrl = settings.business_logo_url ?? '/icons/default-logo.svg';

    return (
        <PublicSiteLayout settings={settings}>
            <Head title={settings.services_title} />
            <PublicHero
                imageUrl={settings.services_hero_image_url}
                title={settings.services_title}
                description={
                    settings.services_hero_description ||
                    settings.services_description
                }
            />
            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {settings.services_description && (
                    <p className="mb-10 max-w-3xl text-muted-foreground">
                        {settings.services_description}
                    </p>
                )}
                <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
                    <aside className="h-fit border-y border-foreground/10 py-5 lg:sticky lg:top-24 lg:border-y-0 lg:border-r lg:pr-6">
                        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                            Categories
                        </p>
                        <nav
                            className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
                            aria-label="Service categories"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedMajorCategory(null);
                                    setSelectedCategory(null);
                                }}
                                className={`flex shrink-0 items-center justify-between gap-4 rounded-full px-4 py-2 text-left text-sm transition lg:rounded-md ${selectedMajorCategory === null ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}
                            >
                                <span>All treatments</span>
                                <span className="text-xs opacity-70">
                                    {services.length}
                                </span>
                            </button>
                            {majorCategories.map((category) => {
                                const serviceCount = services.filter(
                                    (service) =>
                                        service.major_category === category,
                                ).length;
                                const categories = [
                                    ...new Set(
                                        services
                                            .filter(
                                                (service) =>
                                                    service.major_category ===
                                                    category,
                                            )
                                            .map((service) => service.category)
                                            .filter(
                                                (
                                                    serviceCategory,
                                                ): serviceCategory is string =>
                                                    serviceCategory !== null,
                                            ),
                                    ),
                                ];

                                return (
                                    <div key={category} className="shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMajorCategory(
                                                    category,
                                                );
                                                setSelectedCategory(null);
                                            }}
                                            className={`flex w-full items-center justify-between gap-4 rounded-full px-4 py-2 text-left text-sm transition lg:rounded-md ${selectedMajorCategory === category && selectedCategory === null ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}
                                        >
                                            <span>{category}</span>
                                            <span className="text-xs opacity-70">
                                                {serviceCount}
                                            </span>
                                        </button>
                                        <div className="mt-1 flex gap-1 overflow-x-auto pl-4 lg:flex-col lg:overflow-visible">
                                            {categories.map(
                                                (serviceCategory) => (
                                                    <button
                                                        key={serviceCategory}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMajorCategory(
                                                                category,
                                                            );
                                                            setSelectedCategory(
                                                                serviceCategory,
                                                            );
                                                        }}
                                                        className={`shrink-0 rounded-full px-3 py-1.5 text-left text-xs transition lg:rounded-md ${selectedCategory === serviceCategory ? 'bg-primary/15 font-semibold text-primary' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}
                                                    >
                                                        {serviceCategory}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </nav>
                    </aside>

                    <div>
                        <div className="mb-8 flex items-end justify-between gap-4 border-b border-foreground/10 pb-4">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                    {selectedCategory ??
                                        selectedMajorCategory ??
                                        'All treatments'}
                                </p>
                                <h2 className="mt-2 font-serif text-3xl italic sm:text-4xl">
                                    Care designed for you.
                                </h2>
                            </div>
                            <p className="shrink-0 text-sm text-muted-foreground">
                                {displayedServices.length} treatments
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {displayedServices.map((service) => (
                                <article
                                    key={service.id}
                                    className="group flex flex-col overflow-hidden bg-card shadow-lg transition duration-300 hover:shadow-2xl"
                                >
                                    <figure className="flex h-48 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-primary/5">
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
                                    <div className="flex flex-1 flex-col space-y-1 p-3">
                                        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                            {service.major_category}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {service.category}
                                        </p>
                                        <h3 className="font-serif text-xl leading-6 italic">
                                            {service.name}
                                        </h3>
                                        <p className="line-clamp-3 flex-1 pt-1 text-sm leading-5 text-muted-foreground">
                                            {service.description}
                                        </p>
                                    </div>
                                    <Link
                                        href={patientLogin()}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                                    >
                                        Book now{' '}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </article>
                            ))}
                        </div>
                        {displayedServices.length === 0 && (
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
