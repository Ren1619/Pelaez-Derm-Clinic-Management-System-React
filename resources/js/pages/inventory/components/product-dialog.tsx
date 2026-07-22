import { Form, Link } from '@inertiajs/react';
import { Boxes, ImageIcon, Tags } from 'lucide-react';
import {
    restock,
    store,
    update,
} from '@/actions/App/Http/Controllers/InventoryController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
    InventoryBranchOption,
    InventoryCategoryOption,
    ProductBatch,
    ProductDialogMode,
} from '@/types';
import {
    ExpirationBadge,
    formatInventoryDate,
    formatInventoryPrice,
} from './expiration-badge';

type ProductDialogProps = {
    product: ProductBatch | null;
    categories: InventoryCategoryOption[];
    mainBranch: InventoryBranchOption | null;
    mode: ProductDialogMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function ProductImage({ product }: { product: ProductBatch | null }) {
    if (product?.image_url) {
        return (
            <img
                src={product.image_url}
                alt={product.name}
                className="h-52 w-full rounded-lg border object-cover"
            />
        );
    }

    return (
        <div className="flex h-52 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
                <ImageIcon className="size-8" />
                <span className="text-sm">No product image</span>
            </div>
        </div>
    );
}

function Detail({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </span>
            <div className="text-sm">{children}</div>
        </div>
    );
}

function ProductDetails({ product }: { product: ProductBatch }) {
    return (
        <div className="grid gap-5">
            <ProductImage product={product} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Product name">{product.name}</Detail>
                <Detail label="Batch">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                            Batch {product.batch_number ?? 'N/A'}
                        </Badge>
                        {product.is_primary && <Badge>Primary</Badge>}
                    </div>
                </Detail>
                <Detail label="Category">
                    {product.category.category_name}
                </Detail>
                <Detail label="Branch">{product.branch.branch_name}</Detail>
                <Detail label="Measurement unit">
                    {product.measurement_unit}
                </Detail>
                <Detail label="Quantity">{product.quantity}</Detail>
                <Detail label="Price">
                    {formatInventoryPrice(product.price)}
                </Detail>
                <Detail label="Expiration date">
                    <div className="flex flex-col items-start gap-2">
                        <span>
                            {formatInventoryDate(product.expiration_date)}
                        </span>
                        <ExpirationBadge product={product} />
                    </div>
                </Detail>
            </div>
        </div>
    );
}

export function ProductDialog({
    product,
    categories,
    mainBranch,
    mode,
    open,
    onOpenChange,
}: ProductDialogProps) {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const isRestock = mode === 'restock';
    const title = isView
        ? 'Product batch details'
        : isEdit
          ? 'Edit product batch'
          : isRestock
            ? 'Restock product'
            : 'Add product';
    const canCreate = mainBranch !== null && categories.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Boxes className="size-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {isView
                            ? 'Review the selected inventory batch.'
                            : isRestock
                              ? 'Add a future-dated batch or merge into a matching expiration date.'
                              : 'Provide the inventory batch information below.'}
                    </DialogDescription>
                </DialogHeader>

                {isView && product ? (
                    <ProductDetails product={product} />
                ) : (
                    <Form
                        {...(isEdit && product
                            ? update.form(product)
                            : isRestock && product
                              ? restock.form(product)
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
                                <ProductImage product={product} />

                                <div className="grid gap-2">
                                    <Label htmlFor="new_image">
                                        Product image
                                    </Label>
                                    <Input
                                        id="new_image"
                                        name="new_image"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                        aria-invalid={Boolean(errors.new_image)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        JPEG or PNG, up to 5 MB. Leave blank to
                                        keep the current image.
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

                                {(isRestock || isEdit) && product && (
                                    <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                                        {isRestock && (
                                            <Detail label="Product">
                                                {product.name}
                                            </Detail>
                                        )}
                                        <Detail label="Branch">
                                            {product.branch.branch_name}
                                        </Detail>
                                        {isRestock && (
                                            <>
                                                <Detail label="Category">
                                                    {
                                                        product.category
                                                            .category_name
                                                    }
                                                </Detail>
                                                <Detail label="Measurement unit">
                                                    {product.measurement_unit}
                                                </Detail>
                                            </>
                                        )}
                                        {isEdit && (
                                            <Detail label="Expiration date">
                                                {formatInventoryDate(
                                                    product.expiration_date,
                                                )}
                                            </Detail>
                                        )}
                                    </div>
                                )}

                                {!isRestock && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">
                                                Product name
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
                                                defaultValue={
                                                    product?.name ?? ''
                                                }
                                                placeholder="e.g. CeraVe Moisturizing Cream"
                                                maxLength={255}
                                                required
                                                aria-invalid={Boolean(
                                                    errors.name,
                                                )}
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <Label htmlFor="category_ID">
                                                        Product category
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
                                                            href={categoriesIndex(
                                                                {
                                                                    query: {
                                                                        tab: 'products',
                                                                    },
                                                                },
                                                            )}
                                                        >
                                                            <Tags /> Manage
                                                            categories
                                                        </Link>
                                                    </Button>
                                                </div>
                                                <select
                                                    id="category_ID"
                                                    name="category_ID"
                                                    defaultValue={
                                                        product?.category_ID ??
                                                        ''
                                                    }
                                                    required
                                                    disabled={
                                                        categories.length === 0
                                                    }
                                                    aria-invalid={Boolean(
                                                        errors.category_ID,
                                                    )}
                                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                                >
                                                    <option value="" disabled>
                                                        Select a category
                                                    </option>
                                                    {categories.map(
                                                        (category) => (
                                                            <option
                                                                key={
                                                                    category.category_ID
                                                                }
                                                                value={
                                                                    category.category_ID
                                                                }
                                                            >
                                                                {
                                                                    category.category_name
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <InputError
                                                    message={errors.category_ID}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="measurement_unit">
                                                    Measurement unit
                                                    <span
                                                        className="text-primary"
                                                        aria-hidden="true"
                                                    >
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="measurement_unit"
                                                    name="measurement_unit"
                                                    defaultValue={
                                                        product?.measurement_unit ??
                                                        ''
                                                    }
                                                    placeholder="e.g. pcs, tube, ml"
                                                    maxLength={50}
                                                    required
                                                    aria-invalid={Boolean(
                                                        errors.measurement_unit,
                                                    )}
                                                />
                                                <InputError
                                                    message={
                                                        errors.measurement_unit
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!isEdit && !isRestock && mainBranch && (
                                    <>
                                        <input
                                            type="hidden"
                                            name="branch_ID"
                                            value={mainBranch.branch_ID}
                                        />
                                        <div className="grid gap-2">
                                            <Label htmlFor="branch_display">
                                                Branch
                                            </Label>
                                            <Input
                                                id="branch_display"
                                                value={mainBranch.branch_name}
                                                disabled
                                                className="bg-muted/40"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                New inventory can only be added
                                                to the main branch.
                                            </p>
                                            <InputError
                                                message={errors.branch_ID}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="quantity">
                                            {isRestock
                                                ? 'Quantity to add'
                                                : 'Quantity'}
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="quantity"
                                            name="quantity"
                                            type="number"
                                            min={isRestock ? 1 : 0}
                                            max={999999}
                                            defaultValue={
                                                isRestock
                                                    ? ''
                                                    : (product?.quantity ?? '')
                                            }
                                            required
                                            aria-invalid={Boolean(
                                                errors.quantity,
                                            )}
                                        />
                                        <InputError message={errors.quantity} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="price">
                                            Price
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            inputMode="decimal"
                                            min="0"
                                            max="999999.99"
                                            step="0.01"
                                            defaultValue={product?.price ?? ''}
                                            required
                                            aria-invalid={Boolean(errors.price)}
                                        />
                                        <InputError message={errors.price} />
                                    </div>
                                </div>

                                {!isEdit && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="expiration_date">
                                            Expiration date
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="expiration_date"
                                            name="expiration_date"
                                            type="date"
                                            required
                                            aria-invalid={Boolean(
                                                errors.expiration_date,
                                            )}
                                        />
                                        <InputError
                                            message={errors.expiration_date}
                                        />
                                    </div>
                                )}

                                {!isEdit &&
                                    !isRestock &&
                                    (!mainBranch ||
                                        categories.length === 0) && (
                                        <p className="text-sm text-destructive">
                                            A main branch and product category
                                            are required before adding
                                            inventory.
                                        </p>
                                    )}

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
                                            (!isEdit &&
                                                !isRestock &&
                                                !canCreate)
                                        }
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : isEdit
                                              ? 'Update batch'
                                              : isRestock
                                                ? 'Restock product'
                                                : 'Add product'}
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
