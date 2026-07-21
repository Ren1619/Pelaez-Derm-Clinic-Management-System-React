import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { PublicHero, PublicSiteLayout } from '@/components/public-site-layout';
import { login as patientLogin } from '@/routes/patient';
import { branches as branchesRoute, services as servicesRoute } from '@/routes/public';
import type { PublicBranch, PublicService, SystemSettings } from '@/types';

export default function Welcome({ settings, services, branches }: { settings: SystemSettings; services: PublicService[]; branches: PublicBranch[] }) {
    return (
        <PublicSiteLayout settings={settings}>
            <Head title={settings.business_name} />
            <PublicHero imageUrl={settings.landing_hero_image_url} eyebrow={`Serving patients since ${settings.landing_year_started}`} title={settings.landing_primary_tagline} description={settings.landing_secondary_tagline} />

            <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
                {settings.landing_about_image_url && <img src={settings.landing_about_image_url} alt="Clinic" className="h-full max-h-[460px] w-full rounded-2xl object-cover" />}
                <div className="flex flex-col justify-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-primary">About us</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight">Dermatology care centered on you</h2>
                    <p className="mt-5 leading-7 text-muted-foreground">{settings.landing_about_description}</p>
                    <div className="mt-7 flex flex-wrap gap-2">{settings.landing_specializations.map((item) => <span key={item} className="rounded-full border bg-muted/40 px-4 py-2 text-sm">{item}</span>)}</div>
                </div>
            </section>

            <section className="bg-muted/30 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading title="Our Services" description={settings.landing_services_description} href={servicesRoute()} />
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => <article key={service.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">{service.image_url && <img src={service.image_url} alt="" className="h-44 w-full object-cover" />}<div className="p-5"><p className="text-xs font-medium uppercase tracking-wide text-primary">{service.category}</p><h3 className="mt-1 font-semibold">{service.name}</h3><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{service.description}</p></div></article>)}
                        {services.length === 0 && <EmptyState text="Services will appear here once they are added." />}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <SectionHeading title="Our Branches" description={settings.landing_branches_description} href={branchesRoute()} />
                <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {branches.map((branch) => <article key={branch.id} className="rounded-xl border bg-card p-5 shadow-sm"><MapPin className="text-primary" /><h3 className="mt-4 font-semibold">{branch.name}</h3><p className="mt-2 text-sm text-muted-foreground">{branch.location}</p><p className="mt-3 text-sm">{branch.contact_number}</p></article>)}
                    {branches.length === 0 && <EmptyState text="Branch details will appear here once they are added." />}
                </div>
            </section>

            <section className="border-y bg-primary text-primary-foreground">
                <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:px-8">
                    <div><h2 className="text-2xl font-bold">{settings.landing_cta_title}</h2><p className="mt-2 max-w-2xl text-primary-foreground/80">{settings.landing_cta_description}</p></div>
                    <Link href={patientLogin()} className="inline-flex items-center gap-2 rounded-md bg-background px-5 py-3 font-medium text-foreground"><CalendarDays /> Patient portal</Link>
                </div>
            </section>
        </PublicSiteLayout>
    );
}

function SectionHeading({ title, description, href }: { title: string; description: string; href: ReturnType<typeof servicesRoute> }) {
    return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-3xl font-bold tracking-tight">{title}</h2><p className="mt-2 max-w-2xl text-muted-foreground">{description}</p></div><Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-primary">View all <ArrowRight /></Link></div>;
}

function EmptyState({ text }: { text: string }) {
    return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
