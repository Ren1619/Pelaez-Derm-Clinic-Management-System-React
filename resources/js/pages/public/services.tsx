import { Head } from '@inertiajs/react';
import { PublicHero, PublicSiteLayout } from '@/components/public-site-layout';
import type { PublicService, SystemSettings } from '@/types';

export default function PublicServices({
    settings,
    services,
}: {
    settings: SystemSettings;
    services: PublicService[];
}) {
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
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                        <article
                            key={service.id}
                            className="overflow-hidden rounded-xl border bg-card shadow-sm"
                        >
                            {service.image_url && (
                                <img
                                    src={service.image_url}
                                    alt=""
                                    className="h-52 w-full object-cover"
                                />
                            )}
                            <div className="p-5">
                                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                                    {service.major_category}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {service.category}
                                </p>
                                <h2 className="mt-1 text-lg font-semibold">
                                    {service.name}
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                    {service.description}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
                {services.length === 0 && (
                    <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                        No services are available yet.
                    </p>
                )}
            </section>
        </PublicSiteLayout>
    );
}
