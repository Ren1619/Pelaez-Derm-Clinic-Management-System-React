import { Head, useForm } from '@inertiajs/react';
import { ImageIcon, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, update } from '@/routes/system-settings';
import type { SystemSettings } from '@/types';

type SettingsTab = 'landing' | 'services' | 'branches' | 'privacy' | 'business';
type LandingSection =
    'hero' | 'services' | 'about' | 'branches' | 'contact' | 'cta' | 'footer';

const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'landing', label: 'Landing Page' },
    { id: 'services', label: 'Services' },
    { id: 'branches', label: 'Branch' },
    { id: 'privacy', label: 'Privacy Notice' },
    { id: 'business', label: 'Business Details' },
];

const landingSections: Array<{ id: LandingSection; label: string }> = [
    { id: 'hero', label: 'Hero' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'branches', label: 'Branches' },
    { id: 'contact', label: 'Contact' },
    { id: 'cta', label: 'CTA' },
    { id: 'footer', label: 'Footer' },
];

const fieldLimits = {
    title: 80,
    primaryTagline: 80,
    secondaryTagline: 140,
    aboutDescription: 449,
    contactDescription: 240,
    ctaDescription: 240,
    privacySectionTitle: 120,
    privacySectionContent: 2000,
    businessName: 80,
    email: 255,
    footerDays: 60,
} as const;

const textareaClass =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

const formValues = (settings: SystemSettings) => ({
    business_name: settings.business_name,
    business_logo_file: null as File | null,
    remove_business_logo: false,
    landing_primary_tagline: settings.landing_primary_tagline,
    landing_secondary_tagline: settings.landing_secondary_tagline,
    landing_services_title: settings.landing_services_title,
    landing_about_title: settings.landing_about_title,
    landing_branches_title: settings.landing_branches_title,
    landing_contact_title: settings.landing_contact_title,
    landing_year_started: String(settings.landing_year_started),
    landing_hero_image_file: null as File | null,
    remove_landing_hero_image: false,
    landing_about_image_file: null as File | null,
    remove_landing_about_image: false,
    landing_about_description: settings.landing_about_description,
    landing_branches_image_file: null as File | null,
    remove_landing_branches_image: false,
    landing_contact_description: settings.landing_contact_description,
    business_email: settings.business_email,
    landing_cta_title: settings.landing_cta_title,
    landing_cta_description: settings.landing_cta_description,
    footer_days: settings.footer_days,
    footer_opens_at: settings.footer_opens_at.slice(0, 5),
    footer_closes_at: settings.footer_closes_at.slice(0, 5),
    services_title: settings.services_title,
    branches_title: settings.branches_title,
    privacy_title: settings.privacy_title,
    privacy_sections: settings.privacy_sections.length
        ? settings.privacy_sections.map((section) => ({ ...section }))
        : [{ title: '', content: '' }],
});

type SettingsForm = ReturnType<typeof formValues>;

function Field({
    label,
    error,
    required,
    characterLimit,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    characterLimit?: {
        value: string;
        maxLength: number;
    };
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && (
                    <span className="text-primary" aria-hidden="true">
                        *
                    </span>
                )}
            </Label>
            {children}
            {characterLimit && (
                <p className="text-right text-xs text-muted-foreground">
                    {characterLimit.value.length} / {characterLimit.maxLength}{' '}
                    characters
                </p>
            )}
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
            if (file && previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        },
        [file, previewUrl],
    );

    return (
        <Field label={label} error={error}>
            <div className="overflow-hidden rounded-lg border bg-muted/30">
                <div className="flex min-h-44 items-center justify-center p-4">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={`${label} preview`}
                            className="max-h-64 w-full rounded-md object-contain"
                        />
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
                            onChange={(event) =>
                                onFile(event.target.files?.[0] ?? null)
                            }
                        />
                    </Label>
                    {(previewUrl || existingUrl) && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onRemove}
                        >
                            <X /> Remove
                        </Button>
                    )}
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP, or SVG. Maximum 5 MB.
            </p>
        </Field>
    );
}

export default function SystemSettingsIndex({
    settings,
}: {
    settings: SystemSettings;
}) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('landing');
    const [activeLandingSection, setActiveLandingSection] =
        useState<LandingSection>('hero');
    const { data, setData, post, processing, errors, clearErrors } =
        useForm<SettingsForm>(formValues(settings));

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

    const setPrivacySection = (
        position: number,
        field: 'title' | 'content',
        value: string,
    ) => {
        const sections = data.privacy_sections.map((section, index) =>
            index === position ? { ...section, [field]: value } : section,
        );

        setData('privacy_sections', sections);
    };

    const addPrivacySection = () => {
        if (data.privacy_sections.length < 12) {
            setData('privacy_sections', [
                ...data.privacy_sections,
                { title: '', content: '' },
            ]);
        }
    };

    const removePrivacySection = (position: number) => {
        if (data.privacy_sections.length > 1) {
            setData(
                'privacy_sections',
                data.privacy_sections.filter((_, index) => index !== position),
            );
        }
    };

    return (
        <>
            <Head title="System Settings" />
            <div className="p-4 md:p-6">
                <Heading
                    title="System Settings"
                    description="Manage the clinic's public website, branding, and business information."
                />

                <div className="mx-auto max-w-6xl">
                    <div
                        className="mb-6 flex gap-1 overflow-x-auto border-b"
                        role="tablist"
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    clearErrors();
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {activeTab === 'landing' && (
                            <div className="grid min-w-0 gap-5 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
                                <LandingSectionNavigation
                                    activeSection={activeLandingSection}
                                    onSelect={(section) => {
                                        setActiveLandingSection(section);
                                        clearErrors();
                                    }}
                                />
                                <div className="min-w-0">
                                    {activeLandingSection === 'hero' && (
                                        <SettingsCard title="Hero Section">
                                            <ImageField
                                                label="Hero image"
                                                existingUrl={
                                                    settings.landing_hero_image_url
                                                }
                                                file={
                                                    data.landing_hero_image_file
                                                }
                                                removed={
                                                    data.remove_landing_hero_image
                                                }
                                                error={
                                                    errors.landing_hero_image_file
                                                }
                                                onFile={(file) => {
                                                    setData(
                                                        'landing_hero_image_file',
                                                        file,
                                                    );
                                                    setData(
                                                        'remove_landing_hero_image',
                                                        false,
                                                    );
                                                }}
                                                onRemove={() => {
                                                    setData(
                                                        'landing_hero_image_file',
                                                        null,
                                                    );
                                                    setData(
                                                        'remove_landing_hero_image',
                                                        true,
                                                    );
                                                }}
                                            />
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label="Primary tagline"
                                                    required
                                                    characterLimit={{
                                                        value: data.landing_primary_tagline,
                                                        maxLength:
                                                            fieldLimits.primaryTagline,
                                                    }}
                                                    error={
                                                        errors.landing_primary_tagline
                                                    }
                                                >
                                                    <Input
                                                        maxLength={
                                                            fieldLimits.primaryTagline
                                                        }
                                                        value={
                                                            data.landing_primary_tagline
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'landing_primary_tagline',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field
                                                    label="Secondary tagline"
                                                    required
                                                    characterLimit={{
                                                        value: data.landing_secondary_tagline,
                                                        maxLength:
                                                            fieldLimits.secondaryTagline,
                                                    }}
                                                    error={
                                                        errors.landing_secondary_tagline
                                                    }
                                                >
                                                    <Input
                                                        maxLength={
                                                            fieldLimits.secondaryTagline
                                                        }
                                                        value={
                                                            data.landing_secondary_tagline
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'landing_secondary_tagline',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                        </SettingsCard>
                                    )}

                                    {activeLandingSection === 'services' && (
                                        <SettingsCard title="Services Section">
                                            <Field
                                                label="Section title"
                                                required
                                                characterLimit={{
                                                    value: data.landing_services_title,
                                                    maxLength:
                                                        fieldLimits.title,
                                                }}
                                                error={
                                                    errors.landing_services_title
                                                }
                                            >
                                                <Input
                                                    maxLength={
                                                        fieldLimits.title
                                                    }
                                                    value={
                                                        data.landing_services_title
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'landing_services_title',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </SettingsCard>
                                    )}

                                    {activeLandingSection === 'about' && (
                                        <SettingsCard title="About Section">
                                            <Field
                                                label="Section title"
                                                required
                                                characterLimit={{
                                                    value: data.landing_about_title,
                                                    maxLength:
                                                        fieldLimits.title,
                                                }}
                                                error={
                                                    errors.landing_about_title
                                                }
                                            >
                                                <Input
                                                    maxLength={
                                                        fieldLimits.title
                                                    }
                                                    value={
                                                        data.landing_about_title
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'landing_about_title',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <ImageField
                                                label="About image"
                                                existingUrl={
                                                    settings.landing_about_image_url
                                                }
                                                file={
                                                    data.landing_about_image_file
                                                }
                                                removed={
                                                    data.remove_landing_about_image
                                                }
                                                error={
                                                    errors.landing_about_image_file
                                                }
                                                onFile={(file) => {
                                                    setData(
                                                        'landing_about_image_file',
                                                        file,
                                                    );
                                                    setData(
                                                        'remove_landing_about_image',
                                                        false,
                                                    );
                                                }}
                                                onRemove={() => {
                                                    setData(
                                                        'landing_about_image_file',
                                                        null,
                                                    );
                                                    setData(
                                                        'remove_landing_about_image',
                                                        true,
                                                    );
                                                }}
                                            />
                                            <Field
                                                label="Description"
                                                required
                                                characterLimit={{
                                                    value: data.landing_about_description,
                                                    maxLength:
                                                        fieldLimits.aboutDescription,
                                                }}
                                                error={
                                                    errors.landing_about_description
                                                }
                                            >
                                                <textarea
                                                    className={textareaClass}
                                                    maxLength={
                                                        fieldLimits.aboutDescription
                                                    }
                                                    value={
                                                        data.landing_about_description
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'landing_about_description',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label="Year established"
                                                required
                                                error={
                                                    errors.landing_year_started
                                                }
                                            >
                                                <Input
                                                    type="number"
                                                    min="1900"
                                                    max={new Date().getFullYear()}
                                                    value={
                                                        data.landing_year_started
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'landing_year_started',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </SettingsCard>
                                    )}

                                    {activeLandingSection === 'branches' && (
                                        <SettingsCard title="Branches Section">
                                            <Field
                                                label="Section title"
                                                required
                                                characterLimit={{
                                                    value: data.landing_branches_title,
                                                    maxLength:
                                                        fieldLimits.title,
                                                }}
                                                error={
                                                    errors.landing_branches_title
                                                }
                                            >
                                                <Input
                                                    maxLength={
                                                        fieldLimits.title
                                                    }
                                                    value={
                                                        data.landing_branches_title
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'landing_branches_title',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <ImageField
                                                label="Branches portrait image"
                                                existingUrl={
                                                    settings.landing_branches_image_url
                                                }
                                                file={
                                                    data.landing_branches_image_file
                                                }
                                                removed={
                                                    data.remove_landing_branches_image
                                                }
                                                error={
                                                    errors.landing_branches_image_file
                                                }
                                                onFile={(file) => {
                                                    setData(
                                                        'landing_branches_image_file',
                                                        file,
                                                    );
                                                    setData(
                                                        'remove_landing_branches_image',
                                                        false,
                                                    );
                                                }}
                                                onRemove={() => {
                                                    setData(
                                                        'landing_branches_image_file',
                                                        null,
                                                    );
                                                    setData(
                                                        'remove_landing_branches_image',
                                                        true,
                                                    );
                                                }}
                                            />
                                        </SettingsCard>
                                    )}

                                    {activeLandingSection === 'contact' && (
                                        <SettingsCard title="Contact Section">
                                            <Field
                                                label="Section title"
                                                required
                                                characterLimit={{
                                                    value: data.landing_contact_title,
                                                    maxLength:
                                                        fieldLimits.title,
                                                }}
                                                error={
                                                    errors.landing_contact_title
                                                }
                                            >
                                                <Input
                                                    maxLength={
                                                        fieldLimits.title
                                                    }
                                                    value={
                                                        data.landing_contact_title
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'landing_contact_title',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label="Description"
                                                required
                                                characterLimit={{
                                                    value: data.landing_contact_description,
                                                    maxLength:
                                                        fieldLimits.contactDescription,
                                                }}
                                                error={
                                                    errors.landing_contact_description
                                                }
                                            >
                                                <textarea
                                                    className={textareaClass}
                                                    maxLength={
                                                        fieldLimits.contactDescription
                                                    }
                                                    value={
                                                        data.landing_contact_description
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'landing_contact_description',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label="Business email"
                                                required
                                                characterLimit={{
                                                    value: data.business_email,
                                                    maxLength:
                                                        fieldLimits.email,
                                                }}
                                                error={errors.business_email}
                                            >
                                                <Input
                                                    type="email"
                                                    maxLength={
                                                        fieldLimits.email
                                                    }
                                                    value={data.business_email}
                                                    onChange={(e) =>
                                                        setData(
                                                            'business_email',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </SettingsCard>
                                    )}

                                    {activeLandingSection === 'cta' && (
                                        <SettingsCard title="Call to Action">
                                            <Field
                                                label="Call-to-action title"
                                                required
                                                characterLimit={{
                                                    value: data.landing_cta_title,
                                                    maxLength:
                                                        fieldLimits.title,
                                                }}
                                                error={errors.landing_cta_title}
                                            >
                                                <Input
                                                    maxLength={
                                                        fieldLimits.title
                                                    }
                                                    value={
                                                        data.landing_cta_title
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'landing_cta_title',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label="Call-to-action description"
                                                required
                                                characterLimit={{
                                                    value: data.landing_cta_description,
                                                    maxLength:
                                                        fieldLimits.ctaDescription,
                                                }}
                                                error={
                                                    errors.landing_cta_description
                                                }
                                            >
                                                <textarea
                                                    className={textareaClass}
                                                    maxLength={
                                                        fieldLimits.ctaDescription
                                                    }
                                                    value={
                                                        data.landing_cta_description
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'landing_cta_description',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </SettingsCard>
                                    )}

                                    {activeLandingSection === 'footer' && (
                                        <SettingsCard title="Footer">
                                            <Field
                                                label="Operating days"
                                                required
                                                characterLimit={{
                                                    value: data.footer_days,
                                                    maxLength:
                                                        fieldLimits.footerDays,
                                                }}
                                                error={errors.footer_days}
                                            >
                                                <Input
                                                    maxLength={
                                                        fieldLimits.footerDays
                                                    }
                                                    value={data.footer_days}
                                                    onChange={(e) =>
                                                        setData(
                                                            'footer_days',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field
                                                    label="Opening time"
                                                    required
                                                    error={
                                                        errors.footer_opens_at
                                                    }
                                                >
                                                    <Input
                                                        type="time"
                                                        value={
                                                            data.footer_opens_at
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'footer_opens_at',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field
                                                    label="Closing time"
                                                    required
                                                    error={
                                                        errors.footer_closes_at
                                                    }
                                                >
                                                    <Input
                                                        type="time"
                                                        value={
                                                            data.footer_closes_at
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'footer_closes_at',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                        </SettingsCard>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'services' && (
                            <ContentPageSettingsCard
                                prefix="services"
                                title="Services Page"
                                data={data}
                                setData={setData}
                                errors={errors}
                            />
                        )}
                        {activeTab === 'branches' && (
                            <ContentPageSettingsCard
                                prefix="branches"
                                title="Branch Page"
                                data={data}
                                setData={setData}
                                errors={errors}
                            />
                        )}
                        {activeTab === 'privacy' && (
                            <PrivacySettingsCard
                                data={data}
                                setData={setData}
                                errors={errors}
                                onChange={setPrivacySection}
                                onAdd={addPrivacySection}
                                onRemove={removePrivacySection}
                            />
                        )}

                        {activeTab === 'business' && (
                            <SettingsCard title="Business Details">
                                <ImageField
                                    label="Business logo"
                                    existingUrl={settings.business_logo_url}
                                    file={data.business_logo_file}
                                    removed={data.remove_business_logo}
                                    error={errors.business_logo_file}
                                    onFile={(file) => {
                                        setData('business_logo_file', file);
                                        setData('remove_business_logo', false);
                                    }}
                                    onRemove={() => {
                                        setData('business_logo_file', null);
                                        setData('remove_business_logo', true);
                                    }}
                                />
                                <Field
                                    label="Business name"
                                    required
                                    characterLimit={{
                                        value: data.business_name,
                                        maxLength: fieldLimits.businessName,
                                    }}
                                    error={errors.business_name}
                                >
                                    <Input
                                        maxLength={fieldLimits.businessName}
                                        value={data.business_name}
                                        onChange={(e) =>
                                            setData(
                                                'business_name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </SettingsCard>
                        )}

                        <div className="flex justify-end gap-3 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                                onClick={cancelChanges}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Save />
                                {processing ? 'Saving...' : 'Save changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

function SettingsCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                    All fields with{' '}
                    <span className="text-primary" aria-hidden="true">
                        *
                    </span>{' '}
                    are required.
                </p>
            </CardHeader>
            <CardContent className="space-y-5">{children}</CardContent>
        </Card>
    );
}

function LandingSectionNavigation({
    activeSection,
    onSelect,
}: {
    activeSection: LandingSection;
    onSelect: (section: LandingSection) => void;
}) {
    return (
        <nav
            aria-label="Landing page sections"
            className="min-w-0 md:sticky md:top-6 md:border-r md:pr-4"
        >
            <div
                className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible [&::-webkit-scrollbar]:hidden"
                role="tablist"
            >
                {landingSections.map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        role="tab"
                        aria-selected={activeSection === section.id}
                        className={`relative shrink-0 rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors md:rounded-none md:border-0 md:border-r-2 md:px-4 md:py-3 md:text-sm ${activeSection === section.id ? 'border-primary bg-primary text-white md:border-primary md:bg-primary/5 md:text-primary' : 'border-[#eeeeee] bg-[#f7f7f7] text-[#666666] hover:bg-[#eeeeee] hover:text-foreground md:border-transparent md:bg-transparent md:hover:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground'}`}
                        onClick={() => onSelect(section.id)}
                    >
                        {section.label}
                    </button>
                ))}
            </div>
        </nav>
    );
}

function ContentPageSettingsCard({
    prefix,
    title,
    data,
    setData,
    errors,
}: {
    prefix: 'services' | 'branches';
    title: string;
    data: SettingsForm;
    setData: ReturnType<typeof useForm<SettingsForm>>['setData'];
    errors: Record<string, string>;
}) {
    const titleKey = `${prefix}_title` as const;

    return (
        <SettingsCard title={title}>
            <Field
                label={`${title.replace(' Page', '')} title`}
                required
                error={errors[titleKey]}
                characterLimit={{
                    value: data[titleKey],
                    maxLength: fieldLimits.title,
                }}
            >
                <Input
                    maxLength={fieldLimits.title}
                    value={data[titleKey]}
                    onChange={(event) => setData(titleKey, event.target.value)}
                />
            </Field>
        </SettingsCard>
    );
}

function PrivacySettingsCard({
    data,
    setData,
    errors,
    onChange,
    onAdd,
    onRemove,
}: {
    data: SettingsForm;
    setData: ReturnType<typeof useForm<SettingsForm>>['setData'];
    errors: Record<string, string>;
    onChange: (
        position: number,
        field: 'title' | 'content',
        value: string,
    ) => void;
    onAdd: () => void;
    onRemove: (position: number) => void;
}) {
    return (
        <SettingsCard title="Privacy Notice Page">
            <Field
                label="Page title"
                required
                error={errors.privacy_title}
                characterLimit={{
                    value: data.privacy_title,
                    maxLength: fieldLimits.title,
                }}
            >
                <Input
                    maxLength={fieldLimits.title}
                    value={data.privacy_title}
                    onChange={(event) =>
                        setData('privacy_title', event.target.value)
                    }
                />
            </Field>

            <div className="space-y-4">
                {data.privacy_sections.map((section, position) => (
                    <Card
                        key={position}
                        className="border-muted-foreground/20 shadow-none"
                    >
                        <CardHeader className="flex-row items-center justify-between gap-4">
                            <CardTitle className="text-base">
                                Notice item {position + 1}
                            </CardTitle>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                aria-label={`Remove notice item ${position + 1}`}
                                disabled={data.privacy_sections.length === 1}
                                onClick={() => onRemove(position)}
                            >
                                <Trash2 />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <Field
                                label="Item title"
                                required
                                error={
                                    errors[`privacy_sections.${position}.title`]
                                }
                                characterLimit={{
                                    value: section.title,
                                    maxLength: fieldLimits.privacySectionTitle,
                                }}
                            >
                                <Input
                                    maxLength={fieldLimits.privacySectionTitle}
                                    value={section.title}
                                    onChange={(event) =>
                                        onChange(
                                            position,
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Text content"
                                required
                                error={
                                    errors[
                                        `privacy_sections.${position}.content`
                                    ]
                                }
                                characterLimit={{
                                    value: section.content,
                                    maxLength:
                                        fieldLimits.privacySectionContent,
                                }}
                            >
                                <textarea
                                    className={textareaClass}
                                    maxLength={
                                        fieldLimits.privacySectionContent
                                    }
                                    value={section.content}
                                    onChange={(event) =>
                                        onChange(
                                            position,
                                            'content',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <InputError message={errors.privacy_sections} />

            <Button
                type="button"
                variant="outline"
                disabled={data.privacy_sections.length >= 12}
                onClick={onAdd}
            >
                <Plus /> Add notice item
            </Button>
        </SettingsCard>
    );
}

SystemSettingsIndex.layout = {
    breadcrumbs: [{ title: 'System Settings', href: index() }],
};
