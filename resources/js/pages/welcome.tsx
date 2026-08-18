import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Facebook, Mail, Phone } from 'lucide-react';
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
    const landingBranchesImage = settings.landing_branches_image_url;
    const [servicesTitleLead, servicesTitleAccent] = splitSectionTitle(
        settings.landing_services_title,
    );
    const [aboutTitleLead, aboutTitleAccent] = splitSectionTitle(
        settings.landing_about_title,
    );
    const [branchesTitleLead, branchesTitleAccent] = splitSectionTitle(
        settings.landing_branches_title,
    );
    const [contactTitleLead, contactTitleAccent] = splitSectionTitle(
        settings.landing_contact_title,
    );
    const [ctaLead, ctaAccent] = splitClosingWords(settings.landing_cta_title);
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
    const previewServices = categoryServices.slice(0, 4);

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

            {/* Hero Section */}

            <section
                id="home"
                className="relative flex min-h-svh scroll-mt-20 items-center overflow-hidden"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/20 md:bg-gradient-to-r md:from-black/90 md:via-black/70 md:to-black/10" />
                <div
                    className="absolute top-1/4 left-1/4 size-48 rounded-full bg-primary/15 blur-3xl sm:size-72 md:size-96"
                    aria-hidden="true"
                />
                <div
                    className="absolute right-1/4 bottom-1/4 size-44 rounded-full bg-primary/10 blur-3xl sm:size-64 md:size-80"
                    aria-hidden="true"
                />

                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-28 pb-8 sm:px-6 sm:pt-32 sm:pb-12 md:py-36 lg:px-8">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl leading-[0.95] font-black tracking-tight text-white sm:text-6xl md:text-7xl">
                            <span className="inline-block font-serif text-[1.18em] leading-none font-normal text-primary italic">
                                {brandLead}
                            </span>
                            {brandRest && (
                                <span className="mt-2 block">{brandRest}</span>
                            )}
                        </h1>
                        <p className="mt-5 text-base leading-6 text-zinc-200 sm:mt-7 sm:text-lg md:text-xl">
                            {settings.landing_primary_tagline}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-400 sm:text-base">
                            {settings.landing_secondary_tagline}
                        </p>

                        <div className="mt-6 grid max-w-sm grid-cols-1 gap-3 sm:mt-8 sm:flex sm:max-w-none sm:flex-wrap sm:gap-4">
                            <Link
                                href={patientLogin()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-br from-brand-bright via-brand-mid to-brand-deep px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto sm:px-7 sm:py-4 sm:text-base"
                            >
                                <CalendarDays className="size-5" /> Book
                                Appointment
                            </Link>
                            <a
                                href="#services"
                                className="inline-flex w-full items-center justify-center rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 sm:w-auto sm:px-7 sm:py-4 sm:text-base"
                            >
                                Explore Services
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services */}
            <section
                id="services"
                className="relative order-1 flex min-h-[calc(100svh-5rem)] scroll-mt-20 items-center overflow-hidden bg-[#f8f8f6] py-12 sm:py-16 lg:py-28 dark:bg-background"
            >
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
                        <div data-reveal>
                            <h2 className="max-w-3xl text-3xl leading-[1.08] tracking-tight sm:text-5xl lg:text-[4rem]">
                                <span className="sm:whitespace-nowrap">
                                    {servicesTitleLead}
                                </span>{' '}
                                <span className="block font-serif font-normal text-primary italic">
                                    {servicesTitleAccent}
                                </span>
                            </h2>
                        </div>

                        <div
                            data-reveal
                            className="min-w-0 border-b border-foreground/15 lg:self-end"
                            role="tablist"
                            aria-label="Service categories"
                        >
                            <div className="flex [scrollbar-width:none] gap-6 overflow-x-auto pb-3 sm:justify-end sm:gap-12 lg:gap-16 [&::-webkit-scrollbar]:hidden">
                                {serviceCategories.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        role="tab"
                                        aria-selected={
                                            activeServiceCategory === category
                                        }
                                        onClick={() =>
                                            setSelectedServiceCategory(category)
                                        }
                                        className={`relative shrink-0 pb-3 font-serif text-lg italic transition after:absolute after:inset-x-0 after:-bottom-3 after:h-1 sm:text-2xl ${activeServiceCategory === category ? 'text-foreground after:bg-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div
                        data-reveal
                        className="mt-6 min-w-0 pb-4 sm:mt-8 md:pb-8"
                        role="tabpanel"
                    >
                        <div className="grid min-w-0 grid-cols-2 items-start gap-2 py-4 sm:gap-4 md:flex md:justify-center md:gap-16 md:px-5 md:py-8 lg:gap-20 lg:px-8">
                            {previewServices.map((service, index) => (
                                <article
                                    key={service.id}
                                    className={`group flex min-w-0 flex-col overflow-hidden bg-card shadow-lg transition duration-300 hover:z-10 hover:shadow-2xl md:w-52.5 md:shrink-0 lg:w-55 ${serviceCardRotation(index)}`}
                                >
                                    <figure className="flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-primary/10 via-muted to-primary/5 md:aspect-auto md:h-48 lg:h-50">
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
                                    <div className="min-w-0 shrink-0 space-y-1 p-2">
                                        <p className="min-h-4 truncate text-[0.6rem] font-semibold tracking-[0.12em] text-primary uppercase sm:text-xs sm:tracking-[0.16em]">
                                            {service.category ??
                                                activeServiceCategory}
                                        </p>
                                        <h3 className="flex min-h-8 items-center font-serif text-sm leading-4 italic sm:min-h-10 sm:text-xl sm:leading-5">
                                            <span className="line-clamp-2">
                                                {service.name}
                                            </span>
                                        </h3>
                                        <p className="line-clamp-2 min-h-8 text-[0.625rem] leading-4 text-muted-foreground sm:min-h-9 sm:text-[0.6875rem] sm:leading-4.5">
                                            {service.description}
                                        </p>
                                    </div>
                                    <Link
                                        href={patientLogin()}
                                        className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1 bg-primary px-2 text-[0.7rem] font-semibold text-primary-foreground transition hover:brightness-110 sm:h-10 sm:gap-2 sm:px-4 sm:text-xs"
                                    >
                                        Book now{' '}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </article>
                            ))}
                            {previewServices.length === 0 && (
                                <AvailableSoonTag />
                            )}
                        </div>
                    </div>

                    <div className="mt-4 text-center sm:mt-6">
                        <Link
                            href={servicesRoute()}
                            className="group inline-flex items-center gap-3 rounded-full bg-background py-2 pr-2 pl-6 text-[0.7rem] font-semibold tracking-[0.12em] text-primary uppercase shadow-sm ring-1 ring-primary/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/45"
                        >
                            View All Services
                            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <main className="flex flex-col">
                <section
                    id="about"
                    className="relative order-2 flex min-h-[calc(100svh-5rem)] scroll-mt-20 items-center overflow-hidden bg-background py-12 sm:py-16 lg:py-28"
                >
                    <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-7 px-4 sm:gap-9 sm:px-6 lg:min-h-[30rem] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_auto] lg:content-center lg:items-start lg:gap-x-12 lg:gap-y-12 lg:px-8 xl:min-h-[33rem]">
                        <header
                            data-reveal
                            className="mx-auto w-full max-w-5xl text-center lg:col-span-2 lg:col-start-1 lg:row-start-1"
                        >
                            <h2 className="flex flex-col text-3xl leading-[1.06] tracking-tight sm:text-5xl lg:text-[4rem] lg:whitespace-nowrap xl:text-[4.5rem]">
                                <span className="lg:self-start">
                                    {aboutTitleLead}
                                </span>
                                <span className="font-serif font-normal text-primary italic lg:mt-2 lg:self-end lg:pr-12 xl:pr-20">
                                    {aboutTitleAccent}
                                </span>
                            </h2>
                        </header>

                        <figure
                            data-reveal
                            className="relative lg:col-start-2 lg:row-start-2 lg:self-start"
                        >
                            <picture className="relative block aspect-[3/2] overflow-hidden bg-background shadow-xl ring-1 ring-foreground/10 lg:rounded-2xl">
                                <source
                                    media="(min-width: 1024px)"
                                    srcSet={aboutDesktopImage}
                                />
                                <img
                                    src={aboutMobileImage}
                                    alt={`${settings.business_name} clinic`}
                                    className="size-full object-cover transition duration-500 hover:scale-105"
                                    loading="lazy"
                                />
                            </picture>
                        </figure>

                        <div
                            data-reveal
                            className="flex flex-col gap-10 lg:col-start-1 lg:row-start-2 lg:justify-between lg:self-stretch"
                        >
                            <p className="text-justify text-sm leading-6 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                                {settings.landing_about_description}
                            </p>

                            <dl className="grid grid-cols-3 gap-4 text-center sm:max-w-xl sm:gap-8">
                                <ClinicStat
                                    value={stats.years_experience}
                                    label="Years of care"
                                />
                                <ClinicStat
                                    value={stats.branch_count}
                                    label="Clinic branches"
                                />
                                <ClinicStat
                                    value={stats.service_count}
                                    label="Treatments"
                                />
                            </dl>
                        </div>
                    </div>
                </section>

                {/* Branches Section */}
                <section
                    id="branches"
                    className="order-3 flex min-h-[calc(100svh-5rem)] scroll-mt-20 items-center bg-[#f8f8f6] py-12 sm:py-16 lg:py-28 dark:bg-background"
                >
                    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-7 sm:gap-9 lg:min-h-[34rem] lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:gap-0">
                            <header
                                data-reveal
                                className="text-center lg:col-span-7 lg:col-start-5 lg:row-start-1 lg:pt-8 lg:text-left xl:pt-10"
                            >
                                <h2 className="flex flex-col text-3xl leading-[1.06] tracking-tight sm:text-5xl lg:text-[4rem]">
                                    <span>{branchesTitleLead}</span>
                                    <span className="font-serif font-normal text-primary italic sm:ml-[18%] lg:mt-1">
                                        {branchesTitleAccent}
                                    </span>
                                </h2>
                            </header>

                            <figure
                                data-reveal
                                className={`flex aspect-[4/5] items-center justify-center overflow-hidden sm:aspect-[3/4] lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:aspect-[5/8] lg:w-full lg:max-w-[22rem] lg:self-start ${landingBranchesImage ? 'bg-[#f8f8f6]' : 'bg-white'}`}
                            >
                                <img
                                    src={landingBranchesImage ?? logoUrl}
                                    alt={
                                        landingBranchesImage
                                            ? `${settings.business_name} branch portrait`
                                            : settings.business_name
                                    }
                                    className={
                                        landingBranchesImage
                                            ? 'size-full object-cover'
                                            : 'size-28 object-contain opacity-70'
                                    }
                                    loading="lazy"
                                />
                            </figure>

                            <div
                                data-reveal
                                className="grid grid-cols-3 gap-2 self-end sm:gap-4 lg:z-10 lg:col-span-10 lg:col-start-3 lg:row-start-2 lg:gap-4 lg:self-center"
                            >
                                {branches.map((branch) => (
                                    <Link
                                        key={branch.id}
                                        href={branchesRoute()}
                                        aria-label={`View ${branch.name} branch`}
                                        className={`group relative flex aspect-[3/2] items-center justify-center overflow-hidden shadow-md shadow-foreground/10 ${branch.image_url ? 'bg-[#f8f8f6]' : 'bg-white'}`}
                                    >
                                        <img
                                            src={branch.image_url ?? logoUrl}
                                            alt={branch.name}
                                            className={
                                                branch.image_url
                                                    ? 'size-full object-cover transition duration-500 group-hover:scale-105 group-focus-visible:scale-105'
                                                    : 'size-12 object-contain opacity-70 sm:size-16'
                                            }
                                            loading="lazy"
                                        />
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-primary/80 via-primary/35 to-transparent opacity-80 transition duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"
                                        />
                                        <span className="lg:text-md absolute inset-x-3 bottom-2 z-10 line-clamp-2 text-left text-xs text-primary-foreground opacity-100 transition duration-300 sm:bottom-3 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
                                            {branch.name}
                                        </span>
                                    </Link>
                                ))}
                                {branches.length === 0 && (
                                    <div className="col-span-3 flex aspect-[3/1] items-center justify-center border border-dashed px-6 text-center text-sm text-muted-foreground">
                                        Branch images will appear here once they
                                        are added.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center lg:col-span-10 lg:col-start-3 lg:row-start-3 lg:pt-8">
                                <Link
                                    href={branchesRoute()}
                                    className="group inline-flex items-center gap-3 rounded-full bg-background py-2 pr-2 pl-6 text-[0.7rem] font-semibold tracking-[0.12em] text-primary uppercase shadow-sm ring-1 ring-primary/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/45"
                                >
                                    View All Branches
                                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section
                    id="contact"
                    className="order-4 flex min-h-[calc(100svh-5rem)] scroll-mt-20 items-center bg-white py-14 sm:py-20 lg:py-24 dark:bg-background"
                >
                    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                        <header
                            data-reveal
                            className="mx-auto max-w-3xl text-center"
                        >
                            <h2 className="text-3xl leading-[1.08] tracking-tight sm:text-5xl lg:text-[4rem]">
                                {contactTitleLead}{' '}
                                <span className="font-serif font-normal text-primary italic">
                                    {contactTitleAccent}
                                </span>
                            </h2>
                        </header>

                        <div
                            data-reveal
                            className="relative mx-auto mt-9 max-w-6xl overflow-hidden border border-black/8 bg-white shadow-[0_28px_70px_-35px_rgba(18,18,18,0.38)] md:mt-12 dark:border-white/10 dark:bg-card"
                        >
                            <span
                                aria-hidden="true"
                                className="absolute top-0 right-0 h-16 w-24 bg-primary [clip-path:polygon(48%_0,100%_0,100%_100%)] sm:h-24 sm:w-36"
                            />
                            <span
                                aria-hidden="true"
                                className="absolute bottom-0 left-0 h-2 w-1/3 bg-foreground"
                            />
                            <span
                                aria-hidden="true"
                                className="absolute right-0 bottom-0 h-2 w-3/5 bg-primary"
                            />

                            <div className="relative grid pb-2 lg:grid-cols-[0.9fr_2.1fr]">
                                <div className="flex flex-col justify-center border-b border-foreground/10 px-6 py-9 sm:px-10 sm:py-11 lg:border-r lg:border-b-0 lg:px-12">
                                    <img
                                        src={logoUrl}
                                        alt=""
                                        className="size-14 object-contain sm:size-16"
                                    />
                                    <p className="mt-5 max-w-xs text-lg leading-tight font-semibold tracking-tight text-foreground">
                                        {settings.business_name}
                                    </p>

                                    <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
                                        {settings.landing_contact_description}
                                    </p>
                                </div>

                                <div className="grid items-start sm:grid-cols-2 lg:grid-cols-3">
                                    <ExpandableContactCard
                                        icon={<Phone className="size-4" />}
                                        className="border-b border-foreground/10 sm:border-r lg:border-b-0"
                                        title="Contact Number"
                                        expanded={contactsExpanded}
                                        onToggle={() =>
                                            setContactsExpanded(
                                                (expanded) => !expanded,
                                            )
                                        }
                                        expandable={contactBranches.length > 4}
                                    >
                                        {(contactsExpanded
                                            ? contactBranches
                                            : contactBranches.slice(0, 4)
                                        ).map((branch) => (
                                            <p
                                                key={branch.id}
                                                className="flex flex-col gap-0.5 border-b border-primary/10 pb-2 last:border-0 last:pb-0"
                                            >
                                                <span className="text-[0.625rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                                    {branch.name}
                                                </span>
                                                <a
                                                    href={`tel:${branch.contact_number}`}
                                                    className="w-fit text-sm font-medium text-foreground transition-colors hover:text-primary"
                                                >
                                                    {branch.contact_number}
                                                </a>
                                            </p>
                                        ))}
                                        {contactBranches.length === 0 && (
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                Contact numbers will be
                                                available soon.
                                            </p>
                                        )}
                                    </ExpandableContactCard>

                                    <ContactCard
                                        icon={<Mail className="size-4" />}
                                        className="border-b border-foreground/10 lg:border-r lg:border-b-0"
                                        title="Email"
                                    >
                                        <a
                                            href={`mailto:${settings.business_email}`}
                                            className="text-sm font-medium break-all text-foreground transition-colors hover:text-primary"
                                        >
                                            {settings.business_email}
                                        </a>
                                    </ContactCard>

                                    <ExpandableContactCard
                                        icon={<Facebook className="size-4" />}
                                        className="sm:col-span-2 lg:col-span-1"
                                        title="Follow Us"
                                        expanded={socialsExpanded}
                                        onToggle={() =>
                                            setSocialsExpanded(
                                                (expanded) => !expanded,
                                            )
                                        }
                                        expandable={socialBranches.length > 4}
                                    >
                                        {(socialsExpanded
                                            ? socialBranches
                                            : socialBranches.slice(0, 4)
                                        ).map((branch) => (
                                            <a
                                                key={branch.id}
                                                href={
                                                    branch.facebook_link ?? '#'
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block border-b border-primary/10 pb-2 text-sm font-medium text-foreground transition-colors last:border-0 last:pb-0 hover:text-primary"
                                            >
                                                {branch.name}
                                            </a>
                                        ))}
                                        {socialBranches.length === 0 && (
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                Social media links will be
                                                available soon.
                                            </p>
                                        )}
                                    </ExpandableContactCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="relative order-5 overflow-hidden bg-brand-deep py-20 text-white sm:py-24 lg:py-28">
                    <span
                        aria-hidden="true"
                        className="absolute top-0 right-0 h-full w-28 bg-primary/12 [clip-path:polygon(58%_0,100%_0,100%_100%,0_100%)] sm:w-48 lg:w-64"
                    />
                    <span
                        aria-hidden="true"
                        className="absolute bottom-8 left-0 h-px w-1/4 bg-white/20"
                    />
                    <span
                        aria-hidden="true"
                        className="absolute bottom-8 left-1/4 h-px w-16 -skew-x-[35deg] bg-primary"
                    />
                    <div
                        data-reveal
                        className="relative z-10 mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8"
                    >
                        <h2 className="mx-auto max-w-5xl text-3xl leading-[1.08] tracking-tight sm:text-5xl lg:text-[4rem]">
                            {ctaLead && <span>{ctaLead} </span>}
                            <span className="font-serif font-normal text-primary italic">
                                {ctaAccent}
                            </span>
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/70 sm:mt-6 sm:text-base sm:leading-7">
                            {settings.landing_cta_description}
                        </p>
                        <Link
                            href={patientLogin()}
                            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white py-2 pr-2 pl-5 text-xs font-semibold tracking-[0.1em] text-brand-deep uppercase shadow-[0_14px_35px_-20px_rgba(0,0,0,0.65)] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:mt-10 sm:pl-6"
                        >
                            <CalendarDays className="size-4 text-primary" />
                            Book Your Consultation
                            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </span>
                        </Link>
                    </div>
                </section>
            </main>
        </PublicSiteLayout>
    );
}

function ClinicStat({ value, label }: { value: number; label: string }) {
    return (
        <div className="min-w-0 py-2">
            <dt className="font-serif text-3xl font-normal tracking-tight after:mx-auto after:mt-2 after:block after:h-px after:w-6 after:bg-primary/50 sm:text-4xl lg:text-[2.75rem]">
                {value}
            </dt>
            <dd className="mt-2 text-[0.625rem] leading-4 text-muted-foreground sm:text-sm">
                {label}
            </dd>
        </div>
    );
}

function ContactCard({
    className = '',
    icon,
    title,
    children,
}: {
    className?: string;
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <article
            data-reveal
            className={`w-full self-start px-5 py-6 font-sans sm:px-6 lg:px-7 lg:py-7 ${className}`}
        >
            <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center bg-primary text-primary-foreground">
                    {icon}
                </span>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {title}
                </h3>
            </div>
            <div className="mt-4 space-y-2.5 pl-11">{children}</div>
        </article>
    );
}

function ExpandableContactCard({
    className = '',
    icon,
    title,
    children,
    expanded,
    expandable,
    onToggle,
}: {
    className?: string;
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
            className={`w-full self-start px-5 py-6 font-sans sm:px-6 lg:px-7 lg:py-7 ${className}`}
        >
            <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center bg-primary text-primary-foreground">
                    {icon}
                </span>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {title}
                </h3>
            </div>
            <div className="mt-4 space-y-2.5 pl-11">{children}</div>
            {expandable && (
                <button
                    type="button"
                    className="mt-4 ml-11 w-fit border-b border-primary/40 pb-0.5 text-[0.625rem] font-semibold tracking-[0.16em] text-primary uppercase transition-colors hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    onClick={onToggle}
                    aria-expanded={expanded}
                >
                    {expanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </article>
    );
}

function AvailableSoonTag() {
    return (
        <div
            role="status"
            className="relative col-span-2 mx-auto flex w-64 max-w-full shrink-0 justify-center pt-16 sm:w-72"
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
            <div className="relative flex min-h-72 w-full flex-col items-center justify-center border border-primary/30 bg-white px-6 pt-24 pb-8 text-center text-foreground shadow-xl">
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
                <p className="mt-2 font-serif text-2xl italic">Stay tuned</p>
            </div>
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

function splitClosingWords(text: string): [string, string] {
    const words = text.trim().split(/\s+/);

    if (words.length <= 2) {
        return ['', text.trim()];
    }

    return [words.slice(0, -2).join(' '), words.slice(-2).join(' ')];
}

function splitSectionTitle(text: string): [string, string] {
    const normalizedText = text.trim();
    const commaPosition = normalizedText.indexOf(',');

    if (commaPosition >= 0) {
        return [
            normalizedText.slice(0, commaPosition + 1),
            normalizedText.slice(commaPosition + 1).trim(),
        ];
    }

    return splitClosingWords(normalizedText);
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
