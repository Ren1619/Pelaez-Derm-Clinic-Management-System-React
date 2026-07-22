import { Form } from '@inertiajs/react';
import { ReceiptText } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store as storeCategory } from '@/routes/pos/expense-categories';
import { store as storeExpense } from '@/routes/pos/expenses';
import type { PosBranch, PosExpenseCategory } from '@/types';

/** Returns today's local date in the ISO format expected by Laravel. */
function getLocalIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/** Displays the responsive form for recording a daily clinic expense. */
export function ExpenseDialog({
    open,
    onOpenChange,
    categories,
    selectedBranchId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branches: PosBranch[];
    categories: PosExpenseCategory[];
    selectedBranchId: number;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ReceiptText className="size-5" />
                        Add expense
                    </DialogTitle>
                    <DialogDescription>
                        All fields with <span className="text-pink-600">*</span>{' '}
                        are required.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...storeExpense.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-5"
                >
                    {({ processing, errors }) => (
                        <div className="grid gap-4">
                            {/* Daily expenses inherit the active POS branch and today's local date. */}
                            <input
                                type="hidden"
                                name="branch_ID"
                                value={selectedBranchId}
                            />
                            <input
                                type="hidden"
                                name="expense_date"
                                value={getLocalIsoDate()}
                            />

                            <div className="grid gap-2">
                                <Label>
                                    Category
                                    <span
                                        className="text-pink-600"
                                        aria-hidden="true"
                                    >
                                        {' '}
                                        *
                                    </span>
                                </Label>
                                <Select name="category_ID" required>
                                    <SelectTrigger
                                        className="w-full"
                                        aria-invalid={Boolean(
                                            errors.category_ID,
                                        )}
                                    >
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.category_ID}
                                                value={String(
                                                    category.category_ID,
                                                )}
                                            >
                                                {category.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.category_ID} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="expense-description">
                                    Description
                                    <span
                                        className="text-pink-600"
                                        aria-hidden="true"
                                    >
                                        {' '}
                                        *
                                    </span>
                                </Label>
                                <Input
                                    id="expense-description"
                                    name="description"
                                    maxLength={255}
                                    placeholder="Enter expense description"
                                    required
                                    aria-invalid={Boolean(errors.description)}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="expense-amount">
                                    Amount
                                    <span
                                        className="text-pink-600"
                                        aria-hidden="true"
                                    >
                                        {' '}
                                        *
                                    </span>
                                </Label>
                                <Input
                                    id="expense-amount"
                                    name="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                    aria-invalid={Boolean(errors.amount)}
                                />
                                <InputError message={errors.amount} />
                            </div>
                            <DialogFooter className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
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
                                        processing || categories.length === 0
                                    }
                                    className="bg-pink-600 text-white hover:bg-pink-700"
                                >
                                    {processing ? 'Saving…' : 'Save expense'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function ExpenseCategoryDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add expense category</DialogTitle>
                </DialogHeader>
                <Form
                    {...storeCategory.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="category-name">
                                    Category name
                                    <span
                                        className="text-primary"
                                        aria-hidden="true"
                                    >
                                        *
                                    </span>
                                </Label>
                                <Input
                                    id="category-name"
                                    name="category_name"
                                    maxLength={100}
                                    required
                                />
                                <InputError message={errors.category_name} />
                            </div>
                            <DialogFooter className="border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving…' : 'Save category'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
