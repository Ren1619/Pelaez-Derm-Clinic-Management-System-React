import { Form } from '@inertiajs/react';
import { Layers3, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/MajorServiceCategoryController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { MajorServiceCategory } from '@/types';

export function MajorServiceCategoryManager({
    categories,
}: {
    categories: MajorServiceCategory[];
}) {
    const [editingCategory, setEditingCategory] =
        useState<MajorServiceCategory | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] =
        useState<MajorServiceCategory | null>(null);

    const openCreate = () => {
        setEditingCategory(null);
        setFormOpen(true);
    };

    const openEdit = (category: MajorServiceCategory) => {
        setEditingCategory(category);
        setFormOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="grid gap-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Layers3 className="size-4" /> Major service
                            categories
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Superadmin-only parent groups for all service
                            categories.
                        </p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                        <Plus /> Add major category
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    {categories.map((category) => (
                        <div
                            key={category.major_service_category_ID}
                            className="grid gap-3 rounded-lg border p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium">
                                        {category.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {category.categories_count ?? 0} service{' '}
                                        {(category.categories_count ?? 0) === 1
                                            ? 'category'
                                            : 'categories'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(category)}
                                        aria-label={`Edit ${category.name}`}
                                    >
                                        <Pencil />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                            setDeletingCategory(category)
                                        }
                                        disabled={
                                            (category.categories_count ?? 0) > 0
                                        }
                                        aria-label={`Delete ${category.name}`}
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {category.description}
                            </p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <MajorServiceCategoryDialog
                key={editingCategory?.major_service_category_ID ?? 'new'}
                category={editingCategory}
                open={formOpen}
                onOpenChange={setFormOpen}
            />
            <MajorServiceCategoryDeleteDialog
                category={deletingCategory}
                open={deletingCategory !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingCategory(null);
                    }
                }}
            />
        </>
    );
}

function MajorServiceCategoryDialog({
    category,
    open,
    onOpenChange,
}: {
    category: MajorServiceCategory | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const isEdit = category !== null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit' : 'Add'} major service category
                    </DialogTitle>
                    <DialogDescription>
                        This parent category will group related service
                        categories throughout the system.
                    </DialogDescription>
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
                            <div className="grid gap-2">
                                <Label htmlFor="major_category_name">
                                    Name
                                </Label>
                                <Input
                                    id="major_category_name"
                                    name="name"
                                    defaultValue={category?.name ?? ''}
                                    placeholder="e.g. Pathological"
                                    maxLength={255}
                                    required
                                    aria-invalid={Boolean(errors.name)}
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="major_category_description">
                                    Description
                                </Label>
                                <textarea
                                    id="major_category_description"
                                    name="description"
                                    defaultValue={category?.description ?? ''}
                                    rows={4}
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
                                          ? 'Update major category'
                                          : 'Add major category'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function MajorServiceCategoryDeleteDialog({
    category,
    open,
    onOpenChange,
}: {
    category: MajorServiceCategory | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!category) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete major service category</DialogTitle>
                    <DialogDescription>
                        Delete “{category.name}”? Only unused major categories
                        can be deleted.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...destroy.form(category)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <div className="grid gap-4">
                            <InputError
                                message={errors.major_service_category}
                            />
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
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing ? 'Deleting...' : 'Delete'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
