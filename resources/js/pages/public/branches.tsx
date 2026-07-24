import { Head } from '@inertiajs/react';
import { ExternalLink, Facebook, MapPin, Phone } from 'lucide-react';
import { PublicHero, PublicSiteLayout } from '@/components/public-site-layout';
import type { PublicBranch, SystemSettings } from '@/types';

type PublicBranchesProps = {
    settings: SystemSettings;
    branches: PublicBranch[];
};

/** Displays clinic branches in the same card style used for public services. */
export default function PublicBranches({
    settings,
    branches,
}: PublicBranchesProps) {
    const logoUrl = settings.business_logo_url ?? '/icons/default-logo.svg';

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

                <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {branches.map((branch) => (
                        <article
                            key={branch.id}
                            className="group flex flex-col overflow-hidden bg-card shadow-lg transition duration-300 hover:shadow-2xl"
                        >
                            <figure className="flex h-48 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-primary/5">
                                <img
                                    src={branch.image_url ?? logoUrl}
                                    alt={`${branch.name} branch`}
                                    className={
                                        branch.image_url
                                            ? 'size-full object-cover transition duration-500 group-hover:scale-110'
                                            : 'size-20 object-contain'
                                    }
                                    loading="lazy"
                                />
                            </figure>
                            <div className="flex flex-1 flex-col space-y-2 p-4">
                                <h2 className="font-serif text-xl leading-6 italic">
                                    {branch.name}
                                </h2>
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
                                {branch.facebook_link && (
                                    <a
                                        href={branch.facebook_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
                                    >
                                        <Facebook className="size-4" /> Facebook
                                    </a>
                                )}
                            </div>
                            <a
                                href={branch.map_link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-11 w-full items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                            >
                                View map <ExternalLink className="size-4" />
                            </a>
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
