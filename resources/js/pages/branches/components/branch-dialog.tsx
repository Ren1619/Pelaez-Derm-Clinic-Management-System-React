import { Form } from '@inertiajs/react';
import { Building2, ExternalLink, ImageIcon } from 'lucide-react';
import { store, update } from '@/actions/App/Http/Controllers/BranchController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
                <DetailLink label="Map link" href={branch.map_link} />
                <DetailLink label="Facebook link" href={branch.fb_link} />
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
            <span className="text-sm break-words">{value}</span>
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
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="size-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {isView
                            ? 'Review the branch contact and location information.'
                            : 'Provide the clinic branch information below.'}
                    </DialogDescription>
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
                                <BranchImage branch={branch} />

                                <div className="grid gap-2">
                                    <Label htmlFor="branch_img">
                                        Branch image
                                    </Label>
                                    <Input
                                        id="branch_img"
                                        name="branch_img"
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        aria-invalid={Boolean(
                                            errors.branch_img,
                                        )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        JPG or PNG, up to 5 MB.
                                    </p>
                                    <InputError message={errors.branch_img} />
                                    {progress && (
                                        <progress
                                            value={progress.percentage}
                                            max="100"
                                            className="h-2 w-full"
                                        >
                                            {progress.percentage}%
                                        </progress>
                                    )}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
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

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="branch_location">
                                            Branch location
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="branch_location"
                                            name="branch_location"
                                            defaultValue={
                                                branch?.branch_location ?? ''
                                            }
                                            placeholder="Street, city, province"
                                            required
                                            aria-invalid={Boolean(
                                                errors.branch_location,
                                            )}
                                        />
                                        <InputError
                                            message={errors.branch_location}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="map_link">
                                            Map link
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="map_link"
                                            name="map_link"
                                            type="url"
                                            defaultValue={
                                                branch?.map_link ?? ''
                                            }
                                            placeholder="https://maps.google.com/..."
                                            required
                                            aria-invalid={Boolean(
                                                errors.map_link,
                                            )}
                                        />
                                        <InputError message={errors.map_link} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="fb_link">
                                            Facebook link
                                        </Label>
                                        <Input
                                            id="fb_link"
                                            name="fb_link"
                                            type="url"
                                            defaultValue={branch?.fb_link ?? ''}
                                            placeholder="https://facebook.com/..."
                                            aria-invalid={Boolean(
                                                errors.fb_link,
                                            )}
                                        />
                                        <InputError message={errors.fb_link} />
                                    </div>
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
