import { Head } from '@inertiajs/react';
import { PublicPageTitle } from '@/components/public-page-title';
import { PublicSiteLayout } from '@/components/public-site-layout';
import type { SystemSettings } from '@/types';

export default function PrivacyNotice({
    settings,
}: {
    settings: SystemSettings;
}) {
    return (
        <PublicSiteLayout settings={settings}>
            <Head title={settings.privacy_title} />
            <PublicPageTitle title={settings.privacy_title} />

            <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
                <div className="grid gap-4 sm:gap-5">
                    {settings.privacy_sections.map((section, index) => (
                        <article
                            key={`${section.title}-${index}`}
                            className="relative overflow-hidden border border-foreground/10 bg-card px-5 py-6 shadow-sm sm:px-7 sm:py-8"
                        >
                            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                {section.title}
                            </h2>
                            <p className="mt-4 text-justify text-sm leading-7 whitespace-pre-line text-muted-foreground sm:text-base sm:leading-8">
                                {section.content}
                            </p>
                            <div
                                aria-hidden="true"
                                className="absolute inset-x-0 bottom-0 flex h-1.5 gap-5 sm:gap-7"
                            >
                                <span className="w-1/3 bg-foreground" />
                                <span className="flex-1 bg-primary" />
                            </div>
                        </article>
                    ))}

                    {settings.privacy_sections.length === 0 && (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                            The clinic privacy notice has not been published
                            yet.
                        </p>
                    )}
                </div>
            </main>
        </PublicSiteLayout>
    );
}
