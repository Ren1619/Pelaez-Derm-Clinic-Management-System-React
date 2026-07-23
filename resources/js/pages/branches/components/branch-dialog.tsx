import { Form } from '@inertiajs/react';
import { Building2, ExternalLink, ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { store, update } from '@/actions/App/Http/Controllers/BranchController';
import BranchLocationMap from '@/components/branch-location-map';
import ImageUploadField from '@/components/image-upload-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch, BranchDialogMode } from '@/types';

type BranchDialogProps = {
    branch: Branch | null;
    mode: BranchDialogMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type BranchLocationFieldsProps = {
    branch: Branch | null;
    locationError?: string;
    latitudeError?: string;
    longitudeError?: string;
};

/** Collects a plain-text address and an exact map pin. */
function BranchLocationFields({
    branch,
    locationError,
    latitudeError,
    longitudeError,
}: BranchLocationFieldsProps) {
    const [coordinates, setCoordinates] = useState({
        latitude: branch?.latitude ?? null,
        longitude: branch?.longitude ?? null,
    });

    return (
        <div className="grid gap-3">
            <Label htmlFor="branch_location">
                Branch location
                <span className="text-primary" aria-hidden="true">
                    *
                </span>
            </Label>
            <Input
                id="branch_location"
                name="branch_location"
                defaultValue={branch?.branch_location ?? ''}
                placeholder="e.g. Manuel Roxas Street, Valencia City, Bukidnon"
                maxLength={255}
                required
                aria-invalid={Boolean(locationError)}
            />
            <InputError message={locationError} />

            <div className="grid gap-2">
                <Label>
                    Pin location
                    <span className="text-primary" aria-hidden="true">
                        *
                    </span>
                </Label>
                <BranchLocationMap
                    latitude={coordinates.latitude}
                    longitude={coordinates.longitude}
                    interactive
                    onChange={setCoordinates}
                />
                <p className="text-xs text-muted-foreground">
                    Click the map or drag the pink pin to mark the exact branch
                    location.
                </p>
            </div>
            <input
                type="hidden"
                name="latitude"
                value={coordinates.latitude ?? ''}
            />
            <input
                type="hidden"
                name="longitude"
                value={coordinates.longitude ?? ''}
            />
            <InputError message={latitudeError ?? longitudeError} />
        </div>
    );
}

function BranchImage({ branch }: { branch: Branch | null }) {
    if (branch?.image_url) {
        return (
            <img
                src={branch.image_url}
                alt={`${branch.branch_name} branch`}
                className="h-48 w-full rounded-lg border object-cover"
            />
        );
    }

    return (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
                <ImageIcon className="size-8" />
                <span className="text-sm">No branch image</span>
            </div>
        </div>
    );
}

function BranchDetails({ branch }: { branch: Branch }) {
    return (
        <div className="grid gap-5">
            <BranchImage branch={branch} />

            <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Branch name" value={branch.branch_name} />
                <Detail label="Contact number" value={branch.contact_number} />
                <div className="sm:col-span-2">
                    <Detail
                        label="Branch location"
                        value={branch.branch_location}
                    />
                </div>
                {branch.latitude !== null && branch.longitude !== null && (
                    <div className="sm:col-span-2">
                        <BranchLocationMap
                            latitude={branch.latitude}
                            longitude={branch.longitude}
                            className="h-56"
                        />
                    </div>
                )}
                <DetailLink label="Map link" href={branch.map_link} />
                <div className="sm:col-span-2">
                    <DetailLink label="Facebook link" href={branch.fb_link} />
                </div>
            </div>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </span>
            <span className="text-sm wrap-break-word">{value}</span>
        </div>
    );
}

function DetailLink({ label, href }: { label: string; href: string | null }) {
    return (
        <div className="grid gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </span>
            {href ? (
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                >
                    Open link <ExternalLink className="size-3.5" />
                </a>
            ) : (
                <span className="text-sm text-muted-foreground">Not set</span>
            )}
        </div>
    );
}

export function BranchDialog({
    branch,
    mode,
    open,
    onOpenChange,
}: BranchDialogProps) {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const title = isView
        ? 'Branch details'
        : isEdit
          ? 'Edit branch'
          : 'Add branch';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="size-5" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {isView && branch ? (
                    <BranchDetails branch={branch} />
                ) : (
                    <Form
                        {...(isEdit && branch
                            ? update.form(branch)
                            : store.form())}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        resetOnSuccess={!isEdit}
                        className="grid gap-5"
                    >
                        {({ errors, processing, progress }) => (
                            <>
                                <p className="text-sm text-foreground">
                                    All fields with{' '}
                                    <span
                                        className="text-primary"
                                        aria-hidden="true"
                                    >
                                        *
                                    </span>{' '}
                                    are required.
                                </p>
                                <ImageUploadField
                                    key={`${open}-${branch?.branch_ID ?? 'new'}`}
                                    id="branch-image"
                                    name="branch_img"
                                    label="Branch image"
                                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                    helpText="JPEG, PNG, or WebP, up to 20 MB. Leave blank to keep the current image."
                                    existingImageUrl={branch?.image_url}
                                    imageAlt={
                                        branch?.branch_name ??
                                        'Branch image preview'
                                    }
                                    error={errors.branch_img}
                                    progress={progress?.percentage}
                                />

                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="branch_name">
                                            Branch name
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="branch_name"
                                            name="branch_name"
                                            defaultValue={
                                                branch?.branch_name ?? ''
                                            }
                                            placeholder="Valencia City"
                                            required
                                            aria-invalid={Boolean(
                                                errors.branch_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.branch_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_number">
                                            Contact number
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="contact_number"
                                            name="contact_number"
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={11}
                                            defaultValue={
                                                branch?.contact_number ?? ''
                                            }
                                            placeholder="09123456789"
                                            required
                                            aria-invalid={Boolean(
                                                errors.contact_number,
                                            )}
                                        />
                                        <InputError
                                            message={errors.contact_number}
                                        />
                                    </div>

                                    <BranchLocationFields
                                        key={`${open}-${branch?.branch_ID ?? 'new'}-location`}
                                        branch={branch}
                                        locationError={errors.branch_location}
                                        latitudeError={errors.latitude}
                                        longitudeError={errors.longitude}
                                    />
                                </div>

                                <div className="grid w-full min-w-0 gap-2 self-stretch">
                                    <Label htmlFor="fb_link">
                                        Facebook link
                                    </Label>
                                    <Input
                                        id="fb_link"
                                        name="fb_link"
                                        type="url"
                                        defaultValue={branch?.fb_link ?? ''}
                                        placeholder="https://facebook.com/..."
                                        className="block w-full max-w-none"
                                        style={{ width: '100%' }}
                                        aria-invalid={Boolean(errors.fb_link)}
                                    />
                                    <InputError message={errors.fb_link} />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? isEdit
                                                ? 'Updating...'
                                                : 'Adding...'
                                            : isEdit
                                              ? 'Update branch'
                                              : 'Add branch'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
