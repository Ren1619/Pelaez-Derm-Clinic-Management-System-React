import { Head } from '@inertiajs/react';
import { PublicHero, PublicSiteLayout } from '@/components/public-site-layout';
import type { SystemSettings } from '@/types';

export default function PrivacyNotice({ settings }: { settings: SystemSettings }) {
    return <PublicSiteLayout settings={settings}><Head title={settings.privacy_title} /><PublicHero imageUrl={settings.privacy_hero_image_url} title={settings.privacy_title} description={settings.privacy_hero_description} /><article className="mx-auto max-w-4xl px-4 py-14 sm:px-6"><div className="whitespace-pre-wrap text-base leading-8 text-muted-foreground">{settings.privacy_description || 'The clinic privacy notice has not been published yet.'}</div></article></PublicSiteLayout>;
}
