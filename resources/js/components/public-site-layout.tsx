import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { dashboard, home } from '@/routes';
import { login as patientLogin } from '@/routes/patient';
import { index as patientsIndex } from '@/routes/patients';
import {
    branches as branchesRoute,
    privacyNotice,
    services as servicesRoute,
} from '@/routes/public';
import type { Auth, PublicBranch, SystemSettings } from '@/types';

type PublicSiteLayoutProps = {
    settings: SystemSettings;
    children: React.ReactNode;
    landing?: boolean;
    branches?: PublicBranch[];
};

const landingSections = ['home', 'about', 'services', 'branches', 'contact'];

export function PublicSiteLayout({
    settings,
    children,
    landing = false,
    branches = [],
}: PublicSiteLayoutProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(!landing);
    const [activeSection, setActiveSection] = useState('home');
    const [scrollProgress, setScrollProgress] = useState(0);
    const authenticatedHref = auth.permissions.modules.includes('dashboard')
        ? dashboard()
        : patientsIndex();
    const homeUrl = home().url;

    useEffect(() => {
        if (!landing) {
            return;
        }

        const updateNavigation = () => {
            setScrolled(window.scrollY > 50);

            const documentHeight =
                document.documentElement.scrollHeight -
                document.documentElement.clientHeight;
            setScrollProgress(
                documentHeight > 0
                    ? (window.scrollY / documentHeight) * 100
                    : 0,
            );

            const currentSection = landingSections.find((section) => {
                const element = document.getElementById(section);
                const bounds = element?.getBoundingClientRect();

                return (
                    bounds !== undefined &&
                    bounds.top <= 120 &&
                    bounds.bottom >= 120
                );
            });

            setActiveSection(currentSection ?? 'home');
        };

        updateNavigation();
        window.addEventListener('scroll', updateNavigation, { passive: true });

        return () => window.removeEventListener('scroll', updateNavigation);
    }, [landing]);

    const logoUrl = settings.business_logo_url ?? '/icons/default-logo.svg';
    const [brandLead, brandRest] = splitBusinessName(settings.business_name);
    const navigationText =
        landing && !scrolled
            ? 'text-white/90 hover:text-white'
            : 'text-muted-foreground hover:text-foreground';
    const anchorUrl = (section: string) =>
        landing ? `#${section}` : `${homeUrl}#${section}`;

    return (
        <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
            {landing && (
                <div
                    className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-primary transition-[width] duration-100"
                    style={{ width: `${scrollProgress}%` }}
                    aria-hidden="true"
                />
            )}

            <header
                className={`${landing ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b bg-background/95 shadow-sm backdrop-blur-xl' : 'bg-transparent'}`}
            >
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <a
                        href={anchorUrl('home')}
                        className="flex min-w-0 items-center gap-3"
                        onClick={() => setMenuOpen(false)}
                    >
                        <img
                            src={logoUrl}
                            alt={`${settings.business_name} logo`}
                            className="size-10 shrink-0 object-contain"
                        />
                        <span
                            className={`truncate text-xl font-bold ${landing && !scrolled ? 'text-white' : 'text-foreground'}`}
                        >
                            {brandLead}
                            {brandRest && (
                                <>
                                    <span> </span>
                                    <span className="text-primary">
                                        {brandRest}
                                    </span>
                                </>
                            )}
                        </span>
                    </a>

                    <nav
                        className="hidden items-center gap-7 md:flex"
                        aria-label="Primary navigation"
                    >
                        <PublicAnchor
                            href={anchorUrl('home')}
                            label="Home"
                            active={landing && activeSection === 'home'}
                            className={navigationText}
                        />
                        <PublicAnchor
                            href={anchorUrl('about')}
                            label="About"
                            active={landing && activeSection === 'about'}
                            className={navigationText}
                        />
                        <PublicRouteLink
                            href={servicesRoute()}
                            label="Services"
                            active={landing && activeSection === 'services'}
                            className={navigationText}
                        />
                        <PublicRouteLink
                            href={branchesRoute()}
                            label="Branches"
                            active={landing && activeSection === 'branches'}
                            className={navigationText}
                        />
                        <PublicAnchor
                            href={anchorUrl('contact')}
                            label="Contact"
                            active={landing && activeSection === 'contact'}
                            className={navigationText}
                        />
                        <Link
                            href={
                                auth.user ? authenticatedHref : patientLogin()
                            }
                            className="rounded-lg bg-linear-to-br from-brand-bright via-brand-mid to-brand-deep px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            {auth.user ? 'Continue' : 'Login'}
                        </Link>
                    </nav>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={`rounded-lg p-2 transition md:hidden ${landing && !scrolled ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'}`}
                                aria-label={
                                    menuOpen
                                        ? 'Close navigation'
                                        : 'Open navigation'
                                }
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen((open) => !open)}
                            >
                                {menuOpen ? <X /> : <Menu />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {menuOpen ? 'Close navigation' : 'Open navigation'}
                        </TooltipContent>
                    </Tooltip>
                </div>

                {menuOpen && (
                    <nav
                        className="space-y-1 border-t bg-background/95 px-4 py-5 shadow-lg backdrop-blur-xl md:hidden"
                        aria-label="Mobile navigation"
                    >
                        <MobileAnchor
                            href={anchorUrl('home')}
                            label="Home"
                            active={landing && activeSection === 'home'}
                            onClick={() => setMenuOpen(false)}
                        />
                        <MobileAnchor
                            href={anchorUrl('about')}
                            label="About"
                            active={landing && activeSection === 'about'}
                            onClick={() => setMenuOpen(false)}
                        />
                        <MobileRouteLink
                            href={servicesRoute()}
                            label="Services"
                            active={landing && activeSection === 'services'}
                            onClick={() => setMenuOpen(false)}
                        />
                        <MobileRouteLink
                            href={branchesRoute()}
                            label="Branches"
                            active={landing && activeSection === 'branches'}
                            onClick={() => setMenuOpen(false)}
                        />
                        <MobileAnchor
                            href={anchorUrl('contact')}
                            label="Contact"
                            active={landing && activeSection === 'contact'}
                            onClick={() => setMenuOpen(false)}
                        />
                        <Link
                            href={
                                auth.user ? authenticatedHref : patientLogin()
                            }
                            className="mt-4 block rounded-lg bg-linear-to-br from-brand-bright via-brand-mid to-brand-deep px-5 py-3 text-center font-semibold text-white"
                            onClick={() => setMenuOpen(false)}
                        >
                            {auth.user ? 'Continue' : 'Login'}
                        </Link>
                    </nav>
                )}
            </header>

            <main>{children}</main>

            <footer className="bg-zinc-950 py-16 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3">
                                <img
                                    src={logoUrl}
                                    alt={`${settings.business_name} logo`}
                                    className="size-12 object-contain"
                                    loading="lazy"
                                />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {brandLead}
                                        {brandRest && (
                                            <>
                                                <span> </span>
                                                <span className="text-primary">
                                                    {brandRest}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                    <p className="mt-1 text-sm text-zinc-400">
                                        {settings.landing_primary_tagline}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-semibold">Quick Links</h2>
                            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-3 text-sm text-zinc-400 md:flex-col">
                                <a
                                    href={anchorUrl('home')}
                                    className="hover:text-white"
                                >
                                    Home
                                </a>
                                <a
                                    href={anchorUrl('about')}
                                    className="hover:text-white"
                                >
                                    About
                                </a>
                                <Link
                                    href={servicesRoute()}
                                    className="hover:text-white"
                                >
                                    Services
                                </Link>
                                <Link
                                    href={branchesRoute()}
                                    className="hover:text-white"
                                >
                                    Branches
                                </Link>
                                <a
                                    href={anchorUrl('contact')}
                                    className="hover:text-white"
                                >
                                    Contact
                                </a>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-semibold">Contact Info</h2>
                            <div className="mt-5 space-y-3 text-sm text-zinc-400">
                                {branches.slice(0, 3).map((branch) => (
                                    <p key={branch.id}>
                                        {branch.name}:{' '}
                                        <a
                                            href={`tel:${branch.contact_number}`}
                                            className="hover:text-white hover:underline"
                                        >
                                            {branch.contact_number}
                                        </a>
                                    </p>
                                ))}
                                <a
                                    href={`mailto:${settings.business_email}`}
                                    className="block break-all hover:text-white hover:underline"
                                >
                                    {settings.business_email}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col gap-4 border-t border-zinc-800 pt-8 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
                        <p>
                            © {new Date().getFullYear()}{' '}
                            {settings.business_name}. All rights reserved.
                        </p>
                        <Link
                            href={privacyNotice()}
                            className="hover:text-white hover:underline"
                        >
                            Privacy Notice
                        </Link>
                        <p>
                            {settings.footer_days}:{' '}
                            {formatTime(settings.footer_opens_at)} –{' '}
                            {formatTime(settings.footer_closes_at)}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function PublicAnchor({
    href,
    label,
    active,
    className,
}: {
    href: string;
    label: string;
    active: boolean;
    className: string;
}) {
    return (
        <a
            href={href}
            className={`relative py-2 text-sm font-medium transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-primary after:transition-transform ${active ? 'text-primary after:scale-x-100' : `${className} after:scale-x-0`}`}
        >
            {label}
        </a>
    );
}

function PublicRouteLink({
    href,
    label,
    active,
    className,
}: {
    href: ReturnType<typeof servicesRoute>;
    label: string;
    active: boolean;
    className: string;
}) {
    return (
        <Link
            href={href}
            className={`relative py-2 text-sm font-medium transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-primary after:transition-transform ${active ? 'text-primary after:scale-x-100' : `${className} after:scale-x-0`}`}
        >
            {label}
        </Link>
    );
}

function MobileAnchor({
    href,
    label,
    active,
    onClick,
}: {
    href: string;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <a
            href={href}
            onClick={onClick}
            className={`block rounded-r-md border-l-4 px-3 py-2.5 font-medium ${active ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
            {label}
        </a>
    );
}

function MobileRouteLink({
    href,
    label,
    active,
    onClick,
}: {
    href: ReturnType<typeof servicesRoute>;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`block rounded-r-md border-l-4 px-3 py-2.5 font-medium ${active ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
            {label}
        </Link>
    );
}

function splitBusinessName(name: string): [string, string] {
    const [lead, ...rest] = name.trim().split(/\s+/);

    return [lead || name, rest.join(' ')];
}

function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return time;
    }

    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(2000, 0, 1, hours, minutes));
}

export function PublicHero({
    imageUrl,
    eyebrow,
    title,
    description,
}: {
    imageUrl: string | null;
    eyebrow?: string;
    title: string;
    description?: string | null;
}) {
    return (
        <section className="relative isolate overflow-hidden border-b bg-muted/30">
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt=""
                    className="absolute inset-0 -z-20 size-full object-cover"
                />
            )}
            {imageUrl && (
                <div className="absolute inset-0 -z-10 bg-background/80" />
            )}
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
                {eyebrow && (
                    <p className="mb-3 text-sm font-semibold tracking-widest text-primary uppercase">
                        {eyebrow}
                    </p>
                )}
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </section>
    );
}
