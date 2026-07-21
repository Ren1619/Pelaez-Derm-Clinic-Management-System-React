import { Form } from '@inertiajs/react';
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

export function ExpenseDialog({
    open,
    onOpenChange,
    branches,
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add expense</DialogTitle>
                    <DialogDescription>
                        Record a clinic operating expense for the selected
                        branch.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...storeExpense.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="expense-description">
                                    Description
                                </Label>
                                <Input
                                    id="expense-description"
                                    name="description"
                                    maxLength={255}
                                    required
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Branch</Label>
                                    <Select
                                        name="branch_ID"
                                        defaultValue={String(selectedBranchId)}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((branch) => (
                                                <SelectItem
                                                    key={branch.branch_ID}
                                                    value={String(
                                                        branch.branch_ID,
                                                    )}
                                                >
                                                    {branch.branch_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.branch_ID} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select name="category_ID" required>
                                        <SelectTrigger>
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
                                <div className="space-y-2">
                                    <Label htmlFor="expense-amount">
                                        Amount
                                    </Label>
                                    <Input
                                        id="expense-amount"
                                        name="amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                    <InputError message={errors.amount} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expense-date">Date</Label>
                                    <Input
                                        id="expense-date"
                                        name="expense_date"
                                        type="date"
                                        max={new Date()
                                            .toISOString()
                                            .slice(0, 10)}
                                        defaultValue={new Date()
                                            .toISOString()
                                            .slice(0, 10)}
                                        required
                                    />
                                    <InputError message={errors.expense_date} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || categories.length === 0
                                    }
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
                    <DialogDescription>
                        Create a reusable category for clinic expenses.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...storeCategory.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category-name">
                                    Category name
                                </Label>
                                <Input
                                    id="category-name"
                                    name="category_name"
                                    maxLength={100}
                                    required
                                />
                                <InputError message={errors.category_name} />
                            </div>
                            <DialogFooter>
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
