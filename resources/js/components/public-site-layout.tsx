import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { dashboard, home, login } from '@/routes';
import { login as patientLogin } from '@/routes/patient';
import { index as patientsIndex } from '@/routes/patients';
import { branches, privacyNotice, services } from '@/routes/public';
import type { Auth, SystemSettings } from '@/types';

export function PublicSiteLayout({ settings, children }: { settings: SystemSettings; children: React.ReactNode }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [menuOpen, setMenuOpen] = useState(false);
    const authenticatedHref = auth.permissions.modules.includes('dashboard') ? dashboard() : patientsIndex();
    const navItems = [
        { label: 'Home', href: home() },
        { label: 'Services', href: services() },
        { label: 'Branches', href: branches() },
        { label: 'Privacy', href: privacyNotice() },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href={home()} className="flex min-w-0 items-center gap-3 font-semibold">
                        {settings.business_logo_url && <img src={settings.business_logo_url} alt="" className="size-10 rounded-md object-contain" />}
                        <span className="truncate">{settings.business_name}</span>
                    </Link>
                    <nav className="hidden items-center gap-6 md:flex">
                        {navItems.map((item) => <Link key={item.label} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{item.label}</Link>)}
                        {auth.user ? (
                            <Link href={authenticatedHref} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Continue</Link>
                        ) : (
                            <>
                                <Link href={patientLogin()} className="text-sm font-medium">Patient portal</Link>
                                <Link href={login()} className="rounded-md border px-4 py-2 text-sm font-medium">Staff log in</Link>
                            </>
                        )}
                    </nav>
                    <button type="button" className="rounded-md p-2 md:hidden" aria-label="Toggle navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
                </div>
                {menuOpen && (
                    <nav className="space-y-1 border-t p-4 md:hidden">
                        {navItems.map((item) => <Link key={item.label} href={item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">{item.label}</Link>)}
                        <Link href={patientLogin()} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">Patient portal</Link>
                        <Link href={auth.user ? authenticatedHref : login()} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">{auth.user ? 'Continue' : 'Staff log in'}</Link>
                    </nav>
                )}
            </header>

            <main>{children}</main>

            <footer className="border-t bg-muted/30">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
                    <div><p className="font-semibold">{settings.business_name}</p><p className="mt-2 text-sm text-muted-foreground">{settings.landing_contact_description}</p></div>
                    <div><p className="font-medium">Clinic hours</p><p className="mt-2 text-sm text-muted-foreground">{settings.footer_days}<br />{settings.footer_opens_at.slice(0, 5)} – {settings.footer_closes_at.slice(0, 5)}</p></div>
                    <div><p className="font-medium">Contact</p><a className="mt-2 block text-sm text-muted-foreground hover:text-foreground" href={`mailto:${settings.business_email}`}>{settings.business_email}</a></div>
                </div>
            </footer>
        </div>
    );
}

export function PublicHero({ imageUrl, eyebrow, title, description }: { imageUrl: string | null; eyebrow?: string; title: string; description?: string | null }) {
    return (
        <section className="relative isolate overflow-hidden border-b bg-muted/30">
            {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 -z-20 size-full object-cover" />}
            {imageUrl && <div className="absolute inset-0 -z-10 bg-background/80" />}
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
                {eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
                {description && <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>}
            </div>
        </section>
    );
}
