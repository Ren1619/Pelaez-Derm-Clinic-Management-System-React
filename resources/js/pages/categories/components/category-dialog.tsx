import { Form } from '@inertiajs/react';
import { Package, Sparkles } from 'lucide-react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/CategoryController';
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
import type { Category, CategoryType, MajorServiceCategory } from '@/types';

type CategoryDialogProps = {
    category: Category | null;
    categoryType: CategoryType;
    majorServiceCategories: MajorServiceCategory[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function CategoryDialog({
    category,
    categoryType,
    majorServiceCategories,
    open,
    onOpenChange,
}: CategoryDialogProps) {
    const isEdit = category !== null;
    const TypeIcon = categoryType === 'Product' ? Package : Sparkles;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TypeIcon className="size-5" />
                        {isEdit
                            ? 'Edit'
                            : 'Add'} {categoryType.toLowerCase()} category
                    </DialogTitle>
                </DialogHeader>

                <Form
                    {...(category ? update.form(category) : store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    resetOnSuccess={!isEdit}
                    className="grid gap-5"
                >
                    {({ errors, processing }) => (
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
                            <input
                                type="hidden"
                                name="category_type"
                                value={categoryType}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="category_name">
                                    Category name
                                    <span
                                        className="text-primary"
                                        aria-hidden="true"
                                    >
                                        *
                                    </span>
                                </Label>
                                <Input
                                    id="category_name"
                                    name="category_name"
                                    defaultValue={category?.category_name ?? ''}
                                    placeholder={
                                        categoryType === 'Product'
                                            ? 'e.g. Moisturizers'
                                            : 'e.g. Facial Treatments'
                                    }
                                    maxLength={255}
                                    required
                                    autoFocus
                                    aria-invalid={Boolean(errors.category_name)}
                                />
                                <InputError message={errors.category_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category_type_display">
                                    Category type
                                </Label>
                                <Input
                                    id="category_type_display"
                                    value={categoryType}
                                    disabled
                                    className="bg-muted/40"
                                />
                                <InputError message={errors.category_type} />
                            </div>

                            {categoryType === 'Service' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="major_service_category_ID">
                                        Major category
                                    </Label>
                                    <select
                                        id="major_service_category_ID"
                                        name="major_service_category_ID"
                                        defaultValue={
                                            category?.major_service_category_ID ??
                                            ''
                                        }
                                        required
                                        disabled={
                                            majorServiceCategories.length === 0
                                        }
                                        aria-invalid={Boolean(
                                            errors.major_service_category_ID,
                                        )}
                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                    >
                                        <option value="" disabled>
                                            Select a major category
                                        </option>
                                        {majorServiceCategories.map(
                                            (majorCategory) => (
                                                <option
                                                    key={
                                                        majorCategory.major_service_category_ID
                                                    }
                                                    value={
                                                        majorCategory.major_service_category_ID
                                                    }
                                                >
                                                    {majorCategory.name}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <InputError
                                        message={
                                            errors.major_service_category_ID
                                        }
                                    />
                                </div>
                            )}

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
                                    defaultValue={category?.description ?? ''}
                                    placeholder="Describe what belongs in this category."
                                    rows={5}
                                    maxLength={1000}
                                    required
                                    aria-invalid={Boolean(errors.description)}
                                    className="min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                                />
                                <InputError message={errors.description} />
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
                                        ? 'Saving...'
                                        : isEdit
                                          ? 'Update category'
                                          : 'Add category'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
