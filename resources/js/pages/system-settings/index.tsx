import { Head, useForm } from '@inertiajs/react';
import { ImageIcon, Save, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, update } from '@/routes/system-settings';
import type { SystemSettings } from '@/types';

type SettingsTab = 'landing' | 'services' | 'branches' | 'privacy' | 'business';

const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'landing', label: 'Landing Page' },
    { id: 'services', label: 'Services' },
    { id: 'branches', label: 'Branch' },
    { id: 'privacy', label: 'Privacy Notice' },
    { id: 'business', label: 'Business Details' },
];

const textareaClass =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

const formValues = (settings: SystemSettings) => ({
    business_name: settings.business_name,
    business_logo_file: null as File | null,
    remove_business_logo: false,
    landing_primary_tagline: settings.landing_primary_tagline,
    landing_secondary_tagline: settings.landing_secondary_tagline,
    landing_year_started: String(settings.landing_year_started),
    landing_hero_image_file: null as File | null,
    remove_landing_hero_image: false,
    landing_about_image_file: null as File | null,
    remove_landing_about_image: false,
    landing_about_description: settings.landing_about_description,
    landing_specializations: settings.landing_specializations.length
        ? settings.landing_specializations
        : [''],
    landing_services_description: settings.landing_services_description,
    landing_branches_description: settings.landing_branches_description,
    landing_contact_description: settings.landing_contact_description,
    business_email: settings.business_email,
    landing_cta_title: settings.landing_cta_title,
    landing_cta_description: settings.landing_cta_description,
    footer_days: settings.footer_days,
    footer_opens_at: settings.footer_opens_at.slice(0, 5),
    footer_closes_at: settings.footer_closes_at.slice(0, 5),
    services_hero_image_file: null as File | null,
    remove_services_hero_image: false,
    services_hero_description: settings.services_hero_description ?? '',
    services_title: settings.services_title,
    services_description: settings.services_description ?? '',
    branches_hero_image_file: null as File | null,
    remove_branches_hero_image: false,
    branches_hero_description: settings.branches_hero_description ?? '',
    branches_title: settings.branches_title,
    branches_description: settings.branches_description ?? '',
    privacy_hero_image_file: null as File | null,
    remove_privacy_hero_image: false,
    privacy_hero_description: settings.privacy_hero_description ?? '',
    privacy_title: settings.privacy_title,
    privacy_description: settings.privacy_description ?? '',
});

type SettingsForm = ReturnType<typeof formValues>;

function Field({
    label,
    error,
    required,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function ImageField({
    label,
    existingUrl,
    file,
    removed,
    error,
    onFile,
    onRemove,
}: {
    label: string;
    existingUrl: string | null;
    file: File | null;
    removed: boolean;
    error?: string;
    onFile: (file: File | null) => void;
    onRemove: () => void;
}) {
    const previewUrl = useMemo(
        () => (file ? URL.createObjectURL(file) : removed ? null : existingUrl),
        [existingUrl, file, removed],
    );

    useEffect(
        () => () => {
            if (file && previewUrl) URL.revokeObjectURL(previewUrl);
        },
        [file, previewUrl],
    );

    return (
        <Field label={label} error={error}>
            <div className="overflow-hidden rounded-lg border bg-muted/30">
                <div className="flex min-h-44 items-center justify-center p-4">
                    {previewUrl ? (
                        <img src={previewUrl} alt={`${label} preview`} className="max-h-64 w-full rounded-md object-contain" />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ImageIcon className="size-10" />
                            <span className="text-sm">No image selected</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 border-t bg-background p-3">
                    <Label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs hover:bg-accent">
                        Choose image
                        <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.svg"
                            className="sr-only"
                            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
                        />
                    </Label>
                    {(previewUrl || existingUrl) && (
                        <Button type="button" variant="outline" onClick={onRemove}>
                            <X /> Remove
                        </Button>
                    )}
                </div>
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or SVG. Maximum 5 MB.</p>
        </Field>
    );
}

export default function SystemSettingsIndex({ settings }: { settings: SystemSettings }) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('landing');
    const { data, setData, post, processing, errors, clearErrors } = useForm<SettingsForm>(formValues(settings));

    useEffect(() => {
        setData(formValues(settings));
    }, [settings, setData]);

    const cancelChanges = () => {
        setData(formValues(settings));
        clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(update(activeTab).url, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const setSpecialization = (position: number, value: string) => {
        const next = [...data.landing_specializations];
        next[position] = value;
        setData('landing_specializations', next);
    };

    return (
        <>
            <Head title="System Settings" />
            <div className="p-4 md:p-6">
                <Heading title="System Settings" description="Manage the clinic's public website, branding, and business information." />

                <div className="mx-auto max-w-4xl">
                    <div className="mb-6 flex gap-1 overflow-x-auto border-b" role="tablist">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                onClick={() => { setActiveTab(tab.id); clearErrors(); }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {activeTab === 'landing' && (
                            <>
                                <SettingsCard title="Hero Section" description="The first content visitors see on the landing page.">
                                    <ImageField label="Hero image" existingUrl={settings.landing_hero_image_url} file={data.landing_hero_image_file} removed={data.remove_landing_hero_image} error={errors.landing_hero_image_file} onFile={(file) => { setData('landing_hero_image_file', file); setData('remove_landing_hero_image', false); }} onRemove={() => { setData('landing_hero_image_file', null); setData('remove_landing_hero_image', true); }} />
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Primary tagline" required error={errors.landing_primary_tagline}><Input value={data.landing_primary_tagline} onChange={(e) => setData('landing_primary_tagline', e.target.value)} /></Field>
                                        <Field label="Secondary tagline" required error={errors.landing_secondary_tagline}><Input value={data.landing_secondary_tagline} onChange={(e) => setData('landing_secondary_tagline', e.target.value)} /></Field>
                                    </div>
                                    <Field label="Year established" required error={errors.landing_year_started}><Input type="number" min="1900" max={new Date().getFullYear()} value={data.landing_year_started} onChange={(e) => setData('landing_year_started', e.target.value)} /></Field>
                                </SettingsCard>

                                <SettingsCard title="About Section">
                                    <ImageField label="About image" existingUrl={settings.landing_about_image_url} file={data.landing_about_image_file} removed={data.remove_landing_about_image} error={errors.landing_about_image_file} onFile={(file) => { setData('landing_about_image_file', file); setData('remove_landing_about_image', false); }} onRemove={() => { setData('landing_about_image_file', null); setData('remove_landing_about_image', true); }} />
                                    <Field label="Description" required error={errors.landing_about_description}><textarea className={textareaClass} value={data.landing_about_description} onChange={(e) => setData('landing_about_description', e.target.value)} /></Field>
                                    <div className="space-y-3">
                                        <Label>Specializations <span className="text-destructive">*</span></Label>
                                        {[0, 1, 2].map((position) => (
                                            <div key={position}>
                                                <Input placeholder={`Specialization ${position + 1}${position ? ' (optional)' : ''}`} value={data.landing_specializations[position] ?? ''} onChange={(e) => setSpecialization(position, e.target.value)} />
                                                <InputError message={errors[`landing_specializations.${position}`]} />
                                            </div>
                                        ))}
                                    </div>
                                </SettingsCard>

                                <SettingsCard title="Homepage Summaries" description="Short descriptions shown in the landing page sections.">
                                    <Field label="Services summary" required error={errors.landing_services_description}><textarea className={textareaClass} value={data.landing_services_description} onChange={(e) => setData('landing_services_description', e.target.value)} /></Field>
                                    <Field label="Branches summary" required error={errors.landing_branches_description}><textarea className={textareaClass} value={data.landing_branches_description} onChange={(e) => setData('landing_branches_description', e.target.value)} /></Field>
                                    <Field label="Contact summary" required error={errors.landing_contact_description}><textarea className={textareaClass} value={data.landing_contact_description} onChange={(e) => setData('landing_contact_description', e.target.value)} /></Field>
                                    <Field label="Business email" required error={errors.business_email}><Input type="email" value={data.business_email} onChange={(e) => setData('business_email', e.target.value)} /></Field>
                                </SettingsCard>

                                <SettingsCard title="Call to Action and Footer">
                                    <Field label="Call-to-action title" required error={errors.landing_cta_title}><Input value={data.landing_cta_title} onChange={(e) => setData('landing_cta_title', e.target.value)} /></Field>
                                    <Field label="Call-to-action description" required error={errors.landing_cta_description}><textarea className={textareaClass} value={data.landing_cta_description} onChange={(e) => setData('landing_cta_description', e.target.value)} /></Field>
                                    <Field label="Operating days" required error={errors.footer_days}><Input value={data.footer_days} onChange={(e) => setData('footer_days', e.target.value)} /></Field>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Opening time" required error={errors.footer_opens_at}><Input type="time" value={data.footer_opens_at} onChange={(e) => setData('footer_opens_at', e.target.value)} /></Field>
                                        <Field label="Closing time" required error={errors.footer_closes_at}><Input type="time" value={data.footer_closes_at} onChange={(e) => setData('footer_closes_at', e.target.value)} /></Field>
                                    </div>
                                </SettingsCard>
                            </>
                        )}

                        {activeTab === 'services' && <PageSettingsCard prefix="services" title="Services Page" settings={settings} data={data} setData={setData} errors={errors} />}
                        {activeTab === 'branches' && <PageSettingsCard prefix="branches" title="Branch Page" settings={settings} data={data} setData={setData} errors={errors} />}
                        {activeTab === 'privacy' && <PageSettingsCard prefix="privacy" title="Privacy Notice Page" settings={settings} data={data} setData={setData} errors={errors} descriptionRequired />}

                        {activeTab === 'business' && (
                            <SettingsCard title="Business Details" description="Used throughout the public website and clinic branding.">
                                <ImageField label="Business logo" existingUrl={settings.business_logo_url} file={data.business_logo_file} removed={data.remove_business_logo} error={errors.business_logo_file} onFile={(file) => { setData('business_logo_file', file); setData('remove_business_logo', false); }} onRemove={() => { setData('business_logo_file', null); setData('remove_business_logo', true); }} />
                                <Field label="Business name" required error={errors.business_name}><Input value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} /></Field>
                            </SettingsCard>
                        )}

                        <div className="flex justify-end gap-3 border-t pt-4">
                            <Button type="button" variant="outline" disabled={processing} onClick={cancelChanges}>Cancel</Button>
                            <Button type="submit" disabled={processing}><Save />{processing ? 'Saving...' : 'Save changes'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader>
            <CardContent className="space-y-5">{children}</CardContent>
        </Card>
    );
}

function PageSettingsCard({ prefix, title, settings, data, setData, errors, descriptionRequired = false }: {
    prefix: 'services' | 'branches' | 'privacy';
    title: string;
    settings: SystemSettings;
    data: SettingsForm;
    setData: ReturnType<typeof useForm<SettingsForm>>['setData'];
    errors: Record<string, string>;
    descriptionRequired?: boolean;
}) {
    const fileKey = `${prefix}_hero_image_file` as const;
    const removeKey = `remove_${prefix}_hero_image` as const;
    const heroDescriptionKey = `${prefix}_hero_description` as const;
    const titleKey = `${prefix}_title` as const;
    const descriptionKey = `${prefix}_description` as const;
    const imageUrl = settings[`${prefix}_hero_image_url`];

    return (
        <SettingsCard title={title} description="Changes are saved when you click Save changes.">
            <ImageField label="Hero image" existingUrl={imageUrl} file={data[fileKey]} removed={data[removeKey]} error={errors[fileKey]} onFile={(file) => { setData(fileKey, file); setData(removeKey, false); }} onRemove={() => { setData(fileKey, null); setData(removeKey, true); }} />
            <Field label="Hero description" error={errors[heroDescriptionKey]}><textarea className={textareaClass} value={data[heroDescriptionKey]} onChange={(e) => setData(heroDescriptionKey, e.target.value)} /></Field>
            <Field label={`${title.replace(' Page', '')} title`} required error={errors[titleKey]}><Input value={data[titleKey]} onChange={(e) => setData(titleKey, e.target.value)} /></Field>
            <Field label={`${title.replace(' Page', '')} description`} required={descriptionRequired} error={errors[descriptionKey]}><textarea className={textareaClass} value={data[descriptionKey]} onChange={(e) => setData(descriptionKey, e.target.value)} /></Field>
        </SettingsCard>
    );
}

SystemSettingsIndex.layout = {
    breadcrumbs: [{ title: 'System Settings', href: index() }],
};
