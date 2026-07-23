import { Head } from '@inertiajs/react';
import { Facebook, MapPin, Phone } from 'lucide-react';
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

                <div className="grid gap-6 lg:grid-cols-2">
                    {branches.map((branch) => (
                        <article
                            key={branch.id}
                            className="grid overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg sm:min-h-72 sm:grid-cols-[minmax(0,48%)_minmax(0,52%)]"
                        >
                            <div className="flex min-h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-muted to-primary/5 sm:min-h-full sm:[clip-path:ellipse(92%_115%_at_0%_50%)]">
                                {branch.image_url ||
                                settings.business_logo_url ? (
                                    <img
                                        src={
                                            branch.image_url ??
                                            settings.business_logo_url ??
                                            undefined
                                        }
                                        alt={`${branch.name} branch`}
                                        className={
                                            branch.image_url
                                                ? 'size-full object-cover transition duration-500 hover:scale-105'
                                                : 'size-20 object-contain'
                                        }
                                    />
                                ) : (
                                    <MapPin className="size-12 text-primary/40" />
                                )}
                            </div>
                            <div className="flex flex-col justify-center gap-3.5 p-5 sm:py-6 sm:pr-5 sm:pl-3">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold tracking-tight">
                                        {branch.name}
                                    </h2>
                                </div>
                                <p className="flex items-start gap-2 text-sm leading-5 text-muted-foreground">
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                                    <span>{branch.location}</span>
                                </p>
                                <a
                                    href={`tel:${branch.contact_number}`}
                                    className="flex items-center gap-2 text-sm font-medium transition hover:text-primary"
                                >
                                    <Phone className="size-4 shrink-0 text-primary" />
                                    {branch.contact_number}
                                </a>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <a
                                        href={branch.map_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                                    >
                                        View map
                                    </a>
                                    {branch.facebook_link && (
                                        <a
                                            href={branch.facebook_link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary"
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
