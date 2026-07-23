import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    ChevronDown,
    Facebook,
    Mail,
    MapPin,
    Phone,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PublicSiteLayout } from '@/components/public-site-layout';
import { login as patientLogin } from '@/routes/patient';
import {
    branches as branchesRoute,
    services as servicesRoute,
} from '@/routes/public';
import type {
    LandingStats,
    PublicBranch,
    PublicService,
    SystemSettings,
} from '@/types';

type WelcomeProps = {
    settings: SystemSettings;
    services: PublicService[];
    serviceCategories: string[];
    branches: PublicBranch[];
    contactBranches: PublicBranch[];
    stats: LandingStats;
};

export default function Welcome({
    settings,
    services,
    serviceCategories,
    branches,
    contactBranches,
    stats,
}: WelcomeProps) {
    const [contactsExpanded, setContactsExpanded] = useState(false);
    const [socialsExpanded, setSocialsExpanded] = useState(false);
    const [brandLead, brandRest] = splitBusinessName(settings.business_name);
    const logoUrl = settings.business_logo_url ?? '/icons/default-logo.svg';
    const heroDesktopImage =
        settings.landing_hero_image_url ?? '/images/sample103.png';
    const heroMobileImage =
        settings.landing_hero_image_url ?? '/images/hero_mobile_img.png';
    const aboutDesktopImage =
        settings.landing_about_image_url ?? '/images/1995_img.jpg';
    const aboutMobileImage =
        settings.landing_about_image_url ?? '/images/mobile_img.jpg';
    const socialBranches = contactBranches.filter(
        (branch) => branch.facebook_link,
    );
    const [selectedServiceCategory, setSelectedServiceCategory] = useState<
        string | null
    >(null);
    const activeServiceCategory = serviceCategories.includes(
        selectedServiceCategory ?? '',
    )
        ? selectedServiceCategory
        : (serviceCategories[0] ?? null);
    const categoryServices = services.filter(
        (service) =>
            (service.major_category ?? 'Other Care') === activeServiceCategory,
    );

    useRevealAnimations();

    return (
        <PublicSiteLayout
            settings={settings}
            landing
            branches={contactBranches}
        >
            <Head title={settings.business_name}>
                <meta
                    name="description"
                    content={settings.landing_secondary_tagline}
                />
            </Head>

            <section
                id="home"
                className="relative flex min-h-screen scroll-mt-20 items-end overflow-hidden md:items-center"
            >
                <picture className="absolute inset-0">
                    <source
                        media="(min-width: 768px)"
                        srcSet={heroDesktopImage}
                    />
                    <img
                        src={heroMobileImage}
                        alt="Dermatology patient"
                        className="size-full object-cover object-center"
                        fetchPriority="high"
                    />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/10" />
                <div
                    className="absolute top-1/4 left-1/4 size-96 rounded-full bg-primary/15 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="absolute right-1/4 bottom-1/4 size-80 rounded-full bg-primary/10 blur-3xl"
                    aria-hidden="true"
                />

                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-32 pb-12 sm:px-6 md:py-36 lg:px-8">
                    <div className="max-w-2xl">
                        <h1 className="text-5xl leading-[0.95] font-black tracking-tight text-white sm:text-6xl md:text-7xl">
                            <span className="inline-block text-[1.18em] leading-none font-serif font-normal text-primary italic">
                                {brandLead}
                            </span>
                            {brandRest && (
                                <span className="mt-2 block">{brandRest}</span>
                            )}
                        </h1>
                        <p className="mt-7 text-lg text-zinc-200 md:text-xl">
                            {settings.landing_primary_tagline}
                        </p>
                        <p className="mt-2 text-zinc-400">
                            {settings.landing_secondary_tagline}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                href={patientLogin()}
                                className="inline-flex items-center gap-2 rounded-lg bg-linear-to-br from-brand-bright via-brand-mid to-brand-deep px-7 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                <CalendarDays className="size-5" /> Book
                                Appointment
                            </Link>
                            <a
                                href="#services"
                                className="inline-flex items-center rounded-lg border border-white/40 px-7 py-4 font-semibold text-white transition hover:border-white hover:bg-white/10"
                            >
                                Explore Services
                            </a>
                        </div>

                        <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4 text-center text-white sm:gap-10">
                            <HeroStat
                                value={stats.years_experience}
                                label="Years Experience"
                            />
                            <HeroStat
                                value={stats.branch_count}
                                label="Clinic Branches"
                            />
                            <HeroStat
                                value={stats.service_count}
                                label="Treatments"
                            />
                        </dl>
                    </div>
                </div>
            </section>

            <main className="flex flex-col">
                <section
                    id="about"
                    className="order-2 scroll-mt-20 bg-linear-to-br from-background via-primary/5 to-background py-20 lg:py-28"
                >
                    <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
                        <div data-reveal>
                            <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
                                Our philosophy
                            </p>
                            <h2 className="mt-4 text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                                The art of{' '}
                                <span className="text-primary">
                                    healthy skin.
                                </span>
                            </h2>

                            <img
                                src={aboutMobileImage}
                                alt={`${settings.business_name} clinic`}
                                className="mt-8 h-72 w-full rounded-2xl object-cover shadow-xl lg:hidden"
                                loading="lazy"
                            />

                            <p className="mt-8 text-justify text-base leading-8 text-muted-foreground sm:text-lg">
                                {settings.landing_about_description}
                            </p>
                            <ul className="mt-8 space-y-4">
                                {settings.landing_specializations.map(
                                    (specialization) => (
                                        <li
                                            key={specialization}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <Check
                                                    className="size-3.5"
                                                    strokeWidth={3}
                                                />
                                            </span>
                                            <span>{specialization}</span>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>

                        <div
                            data-reveal
                            className="hidden overflow-hidden rounded-2xl shadow-xl lg:block"
                        >
                            <img
                                src={aboutDesktopImage}
                                alt={`${settings.business_name} clinic`}
                                className="h-[520px] w-full object-cover transition duration-500 hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </section>

                <section
                    id="services"
                    className="relative order-1 scroll-mt-20 overflow-hidden bg-[#f8f8f6] py-20 lg:py-28 dark:bg-background"
                >
                    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
                            <div data-reveal>
                                <h2 className="max-w-3xl text-5xl leading-[1.04] tracking-tight sm:text-6xl lg:text-[4rem]">
                                    <span className="sm:whitespace-nowrap">
                                        Exceptional treatments,
                                    </span>{' '}
                                    <span className="block font-serif font-normal italic">
                                        designed for you.
                                    </span>
                                </h2>
                            </div>

                            <div
                                data-reveal
                                className="border-b border-foreground/15 lg:self-end"
                                role="tablist"
                                aria-label="Service categories"
                            >
                                <div className="flex gap-12 overflow-x-auto pb-3 sm:justify-end lg:gap-16">
                                    {serviceCategories.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            role="tab"
                                            aria-selected={
                                                activeServiceCategory ===
                                                category
                                            }
                                            onClick={() =>
                                                setSelectedServiceCategory(
                                                    category,
                                                )
                                            }
                                            className={`relative shrink-0 pb-3 font-serif text-2xl italic transition after:absolute after:inset-x-0 after:-bottom-3 after:h-1 ${activeServiceCategory === category ? 'text-foreground after:bg-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>


                        <div
                            data-reveal
                            className="-mx-4 mt-8 overflow-x-auto pb-12 sm:-mx-6 md:mx-0 md:overflow-visible md:pb-28 lg:mx-0"
                            role="tabpanel"
                        >
                            <div className="flex min-w-max items-start gap-12 px-3 py-8 sm:gap-16 sm:px-5 md:min-w-0 md:justify-center lg:gap-20 lg:px-8">
                                {categoryServices.map((service, index) => (
                                    <article
                                        key={service.id}
                                        className={`group flex w-[190px] shrink-0 flex-col overflow-hidden bg-card shadow-lg transition duration-300 hover:z-10 hover:shadow-2xl sm:w-[210px] lg:w-[220px] ${serviceCardRotation(index)}`}
                                    >
                                        <figure className="flex h-[170px] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-primary/5 sm:h-48 lg:h-[200px]">
                                            <img
                                                src={
                                                    service.image_url ?? logoUrl
                                                }
                                                alt={service.name}
                                                className={
                                                    service.image_url
                                                        ? 'size-full object-cover transition duration-500 group-hover:scale-110'
                                                        : 'size-20 object-contain'
                                                }
                                                loading="lazy"
                                            />
                                        </figure>
                                        <div className="shrink-0 space-y-1 p-2">
                                            <p className="min-h-4 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                                {service.category ??
                                                    activeServiceCategory}
                                            </p>
                                            <h3 className="flex min-h-10 items-center font-serif text-lg leading-5 italic sm:text-xl">
                                                <span className="line-clamp-2">
                                                    {service.name}
                                                </span>
                                            </h3>
                                            <p className="line-clamp-2 min-h-9 text-[0.6875rem] leading-[1.125rem] text-muted-foreground">
                                                {service.description}
                                            </p>
                                        </div>
                                        <Link
                                            href={patientLogin()}
                                            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                                        >
                                            Book now{' '}
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </article>
                                ))}
                                {categoryServices.length === 0 && (
                                    <EmptyPreview message="Services will appear here once they are added." />
                                )}
                            </div>
                        </div>

                        <div className="mt-12 text-center">
                            <Link
                                href={servicesRoute()}
                                className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                            >
                                Explore all services{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                <section
                    id="branches"
                    className="relative order-3 scroll-mt-20 overflow-hidden bg-gradient-to-br from-muted/50 via-background to-primary/5 py-20 lg:py-28"
                >
                    <DecorativeGlow className="-top-40 -right-40 size-80" />
                    <DecorativeGlow className="-bottom-40 -left-40 size-96" />
                    <div className="relative z-10 mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
                        <SectionHeader
                            lead="Our"
                            accent="Branches"
                            description={settings.landing_branches_description}
                        />

                        <div
                            data-reveal
                            className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8"
                        >
                            {branches.map((branch) => (
                                <article
                                    key={branch.id}
                                    className="group overflow-hidden rounded-lg border bg-card shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <figure className="flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-primary/5 sm:h-44 md:h-56">
                                        <img
                                            src={branch.image_url ?? logoUrl}
                                            alt={branch.name}
                                            className={
                                                branch.image_url
                                                    ? 'size-full object-cover transition duration-500 group-hover:scale-110'
                                                    : 'size-14 object-contain'
                                            }
                                            loading="lazy"
                                        />
                                    </figure>
                                    <div className="space-y-4 p-3 sm:p-4">
                                        <h3 className="line-clamp-2 font-semibold transition group-hover:text-primary">
                                            {branch.name}
                                        </h3>
                                        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground sm:text-sm">
                                            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{' '}
                                            <span className="line-clamp-2">
                                                {branch.location ||
                                                    'Location information coming soon'}
                                            </span>
                                        </p>
                                        {branch.contact_number && (
                                            <a
                                                href={`tel:${branch.contact_number}`}
                                                className="flex items-center gap-2 text-xs hover:text-primary hover:underline sm:text-sm"
                                            >
                                                <Phone className="size-4 shrink-0 text-primary" />{' '}
                                                {branch.contact_number}
                                            </a>
                                        )}
                                        {branch.map_link ? (
                                            <a
                                                href={branch.map_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block rounded-lg bg-primary px-3 py-2.5 text-center text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                                            >
                                                View on Map
                                            </a>
                                        ) : (
                                            <span className="block rounded-lg bg-muted px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                                                Map unavailable
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                            {branches.length === 0 && (
                                <EmptyPreview message="Branch details will appear here once they are added." />
                            )}
                        </div>

                        <div className="text-center">
                            <Link
                                href={branchesRoute()}
                                className="inline-flex items-center gap-2 rounded-lg border border-primary px-6 py-4 font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                            >
                                View All Branches{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                <section
                    id="contact"
                    className="order-4 scroll-mt-20 bg-background py-20 lg:py-28"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeader
                            lead="Contact"
                            accent="Us"
                            description={settings.landing_contact_description}
                            accentFirst
                        />

                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                            <ExpandableContactCard
                                icon={<Phone />}
                                title="Contact Numbers"
                                expanded={contactsExpanded}
                                onToggle={() =>
                                    setContactsExpanded((expanded) => !expanded)
                                }
                                expandable={contactBranches.length > 2}
                            >
                                {(contactsExpanded
                                    ? contactBranches
                                    : contactBranches.slice(0, 2)
                                ).map((branch) => (
                                    <p
                                        key={branch.id}
                                        className="text-sm text-muted-foreground sm:text-base"
                                    >
                                        {branch.name}:{' '}
                                        <a
                                            href={`tel:${branch.contact_number}`}
                                            className="hover:text-primary hover:underline"
                                        >
                                            {branch.contact_number}
                                        </a>
                                    </p>
                                ))}
                                {contactBranches.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Contact numbers will be available soon.
                                    </p>
                                )}
                            </ExpandableContactCard>

                            <ContactCard icon={<Mail />} title="Email">
                                <a
                                    href={`mailto:${settings.business_email}`}
                                    className="text-sm break-all text-muted-foreground hover:text-primary hover:underline sm:text-base"
                                >
                                    {settings.business_email}
                                </a>
                            </ContactCard>

                            <ExpandableContactCard
                                icon={<Facebook />}
                                title="Follow Us"
                                expanded={socialsExpanded}
                                onToggle={() =>
                                    setSocialsExpanded((expanded) => !expanded)
                                }
                                expandable={socialBranches.length > 2}
                            >
                                {(socialsExpanded
                                    ? socialBranches
                                    : socialBranches.slice(0, 2)
                                ).map((branch) => (
                                    <a
                                        key={branch.id}
                                        href={branch.facebook_link ?? '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block text-sm text-muted-foreground hover:text-primary hover:underline sm:text-base"
                                    >
                                        {branch.name}
                                    </a>
                                ))}
                                {socialBranches.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Social media links will be available
                                        soon.
                                    </p>
                                )}
                            </ExpandableContactCard>
                        </div>
                    </div>
                </section>

                <section className="relative order-5 overflow-hidden bg-linear-to-br from-brand-bright via-brand-mid to-brand-deep py-20 text-white lg:py-24">
                    <div
                        className="absolute top-10 left-10 size-32 rounded-full bg-white/10 blur-xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute right-10 bottom-10 size-48 rounded-full bg-white/10 blur-xl"
                        aria-hidden="true"
                    />
                    <div
                        data-reveal
                        className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8"
                    >
                        <h2 className="text-4xl leading-tight font-black sm:text-5xl lg:text-6xl">
                            {settings.landing_cta_title}
                        </h2>
                        <p className="mx-auto mt-6 max-w-3xl text-lg text-primary-foreground/85 sm:text-xl">
                            {settings.landing_cta_description}
                        </p>
                        <Link
                            href={patientLogin()}
                            className="mt-10 inline-flex items-center gap-2 rounded-lg bg-background px-6 py-4 text-lg font-bold text-foreground shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                        >
                            <CalendarDays /> Book Your Consultation
                        </Link>
                    </div>
                </section>
            </main>
        </PublicSiteLayout>
    );
}

function HeroStat({ value, label }: { value: number; label: string }) {
    return (
        <div>
            <dt className="text-3xl font-bold">{value}</dt>
            <dd className="mt-1 text-xs text-zinc-400 sm:text-sm">{label}</dd>
        </div>
    );
}

function SectionHeader({
    lead,
    accent,
    description,
    accentFirst = false,
}: {
    lead: string;
    accent: string;
    description: string;
    accentFirst?: boolean;
}) {
    return (
        <header data-reveal className="text-center">
            <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
                Curated care
            </p>
            <h2 className="text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                {accentFirst ? (
                    <>
                        <span className="text-primary">{lead}</span> {accent}
                    </>
                ) : (
                    <>
                        {lead} <span className="text-primary">{accent}</span>
                    </>
                )}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {description}
            </p>
        </header>
    );
}

function DecorativeGlow({ className }: { className: string }) {
    return (
        <div
            className={`pointer-events-none absolute rounded-full bg-primary/15 blur-3xl ${className}`}
            aria-hidden="true"
        />
    );
}

function ContactCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <article
            data-reveal
            className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:p-7"
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-primary/50 to-transparent" />
            <div className="mb-6 flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                    {icon}
                </span>
                <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        {title === 'Email' ? 'Write to us' : 'Connect with us'}
                    </p>
                    <h3 className="mt-1 font-semibold sm:text-lg">{title}</h3>
                </div>
            </div>
            <div className="space-y-2">{children}</div>
        </article>
    );
}

function ExpandableContactCard({
    icon,
    title,
    children,
    expanded,
    expandable,
    onToggle,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    expanded: boolean;
    expandable: boolean;
    onToggle: () => void;
}) {
    return (
        <article
            data-reveal
            className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:p-7"
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-primary/50 to-transparent" />
            <button
                type="button"
                className="mb-6 flex w-full items-center gap-3 text-left"
                onClick={onToggle}
                disabled={!expandable}
                aria-expanded={expanded}
            >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                    {icon}
                </span>
                <div className="flex-1">
                    <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Direct line
                    </p>
                    <h3 className="mt-1 font-semibold sm:text-lg">{title}</h3>
                </div>
                {expandable && (
                    <ChevronDown
                        className={`size-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                )}
            </button>
            <div className="space-y-2">{children}</div>
        </article>
    );
}

function EmptyPreview({ message }: { message: string }) {
    return (
        <div className="col-span-full rounded-xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}

function serviceCardRotation(index: number): string {
    return [
        'md:translate-y-24 md:rotate-[-16deg]',
        'md:translate-y-6 md:rotate-[-5deg]',
        'md:translate-y-6 md:rotate-[5deg]',
        'md:translate-y-24 md:rotate-[16deg]',
    ][index % 4];
}

function splitBusinessName(name: string): [string, string] {
    const [lead, ...rest] = name.trim().split(/\s+/);

    return [lead || name, rest.join(' ')];
}

function useRevealAnimations() {
    useEffect(() => {
        const elements =
            document.querySelectorAll<HTMLElement>('[data-reveal]');

        if (!('IntersectionObserver' in window)) {
            elements.forEach((element) =>
                element.classList.add('landing-reveal-visible'),
            );

            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('landing-reveal-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
        );

        elements.forEach((element) => {
            element.classList.add('landing-reveal');
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);
}
