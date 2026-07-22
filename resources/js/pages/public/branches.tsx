import { Head } from '@inertiajs/react';
import { Facebook, MapPin, Phone } from 'lucide-react';
import BranchLocationMap from '@/components/branch-location-map';
import { PublicHero, PublicSiteLayout } from '@/components/public-site-layout';
import type { PublicBranch, SystemSettings } from '@/types';

type PublicBranchesProps = {
    settings: SystemSettings;
    branches: PublicBranch[];
};

/** Displays every clinic branch with its exact pinned location. */
export default function PublicBranches({
    settings,
    branches,
}: PublicBranchesProps) {
    return (
        <PublicSiteLayout settings={settings}>
            <Head title={settings.branches_title} />
            <PublicHero
                imageUrl={settings.branches_hero_image_url}
                title={settings.branches_title}
                description={
                    settings.branches_hero_description ||
                    settings.branches_description
                }
            />
            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {settings.branches_description && (
                    <p className="mb-10 max-w-3xl text-muted-foreground">
                        {settings.branches_description}
                    </p>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {branches.map((branch) => (
                        <article
                            key={branch.id}
                            className="overflow-hidden rounded-xl border bg-card shadow-sm"
                        >
                            {branch.image_url && (
                                <img
                                    src={branch.image_url}
                                    alt={`${branch.name} branch`}
                                    className="h-56 w-full object-cover"
                                />
                            )}
                            {branch.latitude !== null &&
                                branch.longitude !== null && (
                                    <BranchLocationMap
                                        latitude={branch.latitude}
                                        longitude={branch.longitude}
                                        className="h-64 rounded-none border-x-0"
                                    />
                                )}
                            <div className="space-y-4 p-6">
                                <h2 className="text-xl font-semibold">
                                    {branch.name}
                                </h2>
                                <p className="flex gap-3 text-sm text-muted-foreground">
                                    <MapPin className="size-5 shrink-0" />
                                    {branch.location}
                                </p>
                                <a
                                    href={`tel:${branch.contact_number}`}
                                    className="flex gap-3 text-sm"
                                >
                                    <Phone className="size-5" />
                                    {branch.contact_number}
                                </a>
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href={branch.map_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-md border px-4 py-2 text-sm font-medium"
                                    >
                                        View map
                                    </a>
                                    {branch.facebook_link && (
                                        <a
                                            href={branch.facebook_link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
                                        >
                                            <Facebook className="size-4" />
                                            Facebook
                                        </a>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {branches.length === 0 && (
                    <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                        No branches are available yet.
                    </p>
                )}
            </section>
        </PublicSiteLayout>
    );
}
