import { Head } from '@inertiajs/react';
import { ExternalLink, Facebook, MapPin, Phone } from 'lucide-react';
import { PublicPageTitle } from '@/components/public-page-title';
import { PublicSiteLayout } from '@/components/public-site-layout';
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
            <PublicPageTitle title={settings.branches_title} />
            <section className="mx-auto w-full max-w-7xl overflow-hidden px-2 pt-0 pb-10 sm:px-6 sm:py-14 lg:px-8">
                <div className="mx-auto grid w-full max-w-[58rem] min-w-0 grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                    {branches.map((branch) => (
                        <article
                            key={branch.id}
                            className="group flex min-w-0 flex-col overflow-hidden rounded-md bg-card shadow-sm transition duration-300 hover:shadow-xl"
                        >
                            <figure className="flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-primary/5">
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
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2 sm:gap-2 sm:p-4">
                                <h2 className="truncate font-serif text-xs leading-4 italic sm:text-base sm:leading-6">
                                    {branch.name}
                                </h2>
                                <p className="flex min-w-0 items-start gap-1 text-[0.7rem] leading-4 text-muted-foreground sm:gap-2 sm:text-sm sm:leading-5">
                                    <MapPin className="mt-0.5 size-3 shrink-0 text-primary sm:size-4" />
                                    <span className="line-clamp-2 min-w-0 break-words">
                                        {branch.location}
                                    </span>
                                </p>
                                <a
                                    href={`tel:${branch.contact_number}`}
                                    className="flex min-w-0 items-center gap-1 text-[0.7rem] font-medium transition hover:text-primary sm:gap-2 sm:text-sm"
                                >
                                    <Phone className="size-3 shrink-0 text-primary sm:size-4" />
                                    <span className="min-w-0 truncate">
                                        {branch.contact_number}
                                    </span>
                                </a>
                                {branch.facebook_link && (
                                    <a
                                        href={branch.facebook_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground transition hover:text-primary sm:gap-1.5 sm:text-sm"
                                    >
                                        <Facebook className="size-3 sm:size-4" />{' '}
                                        Facebook
                                    </a>
                                )}
                            </div>
                            <a
                                href={branch.map_link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 w-full items-center justify-center gap-1 bg-primary px-2 text-[0.7rem] font-semibold text-primary-foreground transition hover:brightness-110 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
                            >
                                View map{' '}
                                <ExternalLink className="size-3.5 sm:size-4" />
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
