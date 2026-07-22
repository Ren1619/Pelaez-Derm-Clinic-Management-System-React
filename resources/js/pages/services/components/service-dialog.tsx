import { Form, Link } from '@inertiajs/react';
import { ImageIcon, Sparkles, Tags } from 'lucide-react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/ServiceController';
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
import { index as categoriesIndex } from '@/routes/categories';
import type {
    ClinicService,
    ServiceCategoryOption,
    ServiceDialogMode,
} from '@/types';

type ServiceDialogProps = {
    service: ClinicService | null;
    categories: ServiceCategoryOption[];
    mode: ServiceDialogMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function ServiceImage({ service }: { service: ClinicService | null }) {
    if (service?.image_url) {
        return (
            <img
                src={service.image_url}
                alt={service.name}
                className="h-52 w-full rounded-lg border object-cover"
            />
        );
    }

    return (
        <div className="flex h-52 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
                <ImageIcon className="size-8" />
                <span className="text-sm">No service image</span>
            </div>
        </div>
    );
}

function ServiceDetails({ service }: { service: ClinicService }) {
    return (
        <div className="grid gap-5">
            <ServiceImage service={service} />
            <div className="grid gap-4">
                <div className="grid gap-1.5">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Service name
                    </span>
                    <span className="text-sm font-medium">{service.name}</span>
                </div>
                <div className="grid gap-1.5">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Category
                    </span>
                    <span className="text-sm">
                        {service.category.category_name}
                    </span>
                </div>
                <div className="grid gap-1.5">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Description
                    </span>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {service.description}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function ServiceDialog({
    service,
    categories,
    mode,
    open,
    onOpenChange,
}: ServiceDialogProps) {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const title = isView
        ? 'Service details'
        : isEdit
          ? 'Edit service'
          : 'Add service';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {isView
                            ? 'Review the service information and category.'
                            : 'Provide the clinic service information below.'}
                    </DialogDescription>
                </DialogHeader>

                {isView && service ? (
                    <ServiceDetails service={service} />
                ) : (
                    <Form
                        {...(isEdit && service
                            ? update.form(service)
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
                                <ServiceImage service={service} />

                                <div className="grid gap-2">
                                    <Label htmlFor="new_image">
                                        Service image
                                    </Label>
                                    <Input
                                        id="new_image"
                                        name="new_image"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
                                        aria-invalid={Boolean(errors.new_image)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        JPEG, PNG, WebP, HEIC, or HEIF, up to 20
                                        MB. Leave blank to keep the current
                                        image.
                                    </p>
                                    <InputError message={errors.new_image} />
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

                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <Label htmlFor="category_ID">
                                                Service category
                                                <span
                                                    className="text-primary"
                                                    aria-hidden="true"
                                                >
                                                    *
                                                </span>
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0"
                                                asChild
                                            >
                                                <Link
                                                    href={categoriesIndex({
                                                        query: {
                                                            tab: 'services',
                                                        },
                                                    })}
                                                >
                                                    <Tags /> Manage categories
                                                </Link>
                                            </Button>
                                        </div>
                                        <select
                                            id="category_ID"
                                            name="category_ID"
                                            defaultValue={
                                                service?.category_ID ?? ''
                                            }
                                            required
                                            disabled={categories.length === 0}
                                            aria-invalid={Boolean(
                                                errors.category_ID,
                                            )}
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                        >
                                            <option value="" disabled>
                                                Select a category
                                            </option>
                                            {categories.map((category) => (
                                                <option
                                                    key={category.category_ID}
                                                    value={category.category_ID}
                                                >
                                                    {category.category_name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.category_ID}
                                        />
                                        {categories.length === 0 && (
                                            <p className="text-xs text-destructive">
                                                Add a service category before
                                                creating a service.
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="name">
                                            Service name
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={service?.name ?? ''}
                                            placeholder="e.g. Hydra Facial"
                                            maxLength={255}
                                            required
                                            aria-invalid={Boolean(errors.name)}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">
                                            Description
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            defaultValue={
                                                service?.description ?? ''
                                            }
                                            placeholder="Describe the service and its purpose."
                                            rows={5}
                                            maxLength={1000}
                                            required
                                            aria-invalid={Boolean(
                                                errors.description,
                                            )}
                                            className="min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
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
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            categories.length === 0
                                        }
                                    >
                                        {processing
                                            ? isEdit
                                                ? 'Updating...'
                                                : 'Adding...'
                                            : isEdit
                                              ? 'Update service'
                                              : 'Add service'}
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
