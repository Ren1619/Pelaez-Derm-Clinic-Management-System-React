import { Form } from '@inertiajs/react';
import { Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/StaffAccountController';
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
import type {
    AccountRole,
    StaffAccount,
    StaffBranchOption,
    StaffDialogMode,
} from '@/types';

type StaffDialogProps = {
    staffAccount: StaffAccount | null;
    branches: StaffBranchOption[];
    roles: AccountRole[];
    mode: StaffDialogMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    staff: 'Staff',
    doctor: 'Doctor',
};

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

function StaffDetails({ staffAccount }: { staffAccount: StaffAccount }) {
    return (
        <div className="grid gap-5">
            <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                        {staffAccount.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {roleLabels[staffAccount.role.role_name] ??
                            staffAccount.role.role_name}
                    </p>
                </div>
                <Badge
                    variant={staffAccount.is_active ? 'default' : 'secondary'}
                >
                    {staffAccount.is_active ? 'Active' : 'Inactive'}
                </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Detail
                    label="Branch"
                    value={staffAccount.branch?.branch_name ?? 'All branches'}
                />
                <Detail
                    label="Email verification"
                    value={
                        staffAccount.email_verified_at
                            ? 'Verified'
                            : 'Not verified'
                    }
                />
                <Detail label="Email" value={staffAccount.email} />
                <Detail
                    label="Contact number"
                    value={staffAccount.contact_number}
                />
            </div>
        </div>
    );
}

export function StaffDialog({
    staffAccount,
    branches,
    roles,
    mode,
    open,
    onOpenChange,
}: StaffDialogProps) {
    const [roleId, setRoleId] = useState(
        String(staffAccount?.role_ID ?? roles[0]?.role_ID ?? ''),
    );
    const selectedRole = roles.find((role) => String(role.role_ID) === roleId);
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const isSuperAdmin = selectedRole?.role_name === 'super_admin';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="size-5" />
                        {isView
                            ? 'Staff details'
                            : isEdit
                              ? 'Edit staff account'
                              : 'Add staff account'}
                    </DialogTitle>
                    <DialogDescription>
                        {isView
                            ? 'Review this staff member’s account information.'
                            : isEdit
                              ? 'Update the staff member’s assignment and account information.'
                              : 'A secure temporary password and verification link will be emailed to the staff member.'}
                    </DialogDescription>
                </DialogHeader>

                {isView && staffAccount ? (
                    <StaffDetails staffAccount={staffAccount} />
                ) : (
                    <Form
                        {...(isEdit && staffAccount
                            ? update.form(staffAccount)
                            : store.form())}
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
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">
                                            First name
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            defaultValue={
                                                staffAccount?.first_name ?? ''
                                            }
                                            autoComplete="given-name"
                                            required
                                            aria-invalid={Boolean(
                                                errors.first_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.first_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="middle_name">
                                            Middle name
                                        </Label>
                                        <Input
                                            id="middle_name"
                                            name="middle_name"
                                            defaultValue={
                                                staffAccount?.middle_name ?? ''
                                            }
                                            autoComplete="additional-name"
                                            aria-invalid={Boolean(
                                                errors.middle_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.middle_name}
                                        />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="last_name">
                                            Last name
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            defaultValue={
                                                staffAccount?.last_name ?? ''
                                            }
                                            autoComplete="family-name"
                                            required
                                            aria-invalid={Boolean(
                                                errors.last_name,
                                            )}
                                        />
                                        <InputError
                                            message={errors.last_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Email
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                className="pl-9"
                                                defaultValue={
                                                    staffAccount?.email ?? ''
                                                }
                                                autoComplete="email"
                                                required
                                                aria-invalid={Boolean(
                                                    errors.email,
                                                )}
                                            />
                                        </div>
                                        <InputError message={errors.email} />
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
                                        <div className="relative">
                                            <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="contact_number"
                                                name="contact_number"
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={11}
                                                className="pl-9"
                                                defaultValue={
                                                    staffAccount?.contact_number ??
                                                    ''
                                                }
                                                placeholder="09123456789"
                                                required
                                                aria-invalid={Boolean(
                                                    errors.contact_number,
                                                )}
                                            />
                                        </div>
                                        <InputError
                                            message={errors.contact_number}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="role_ID">
                                            Role
                                            <span
                                                className="text-primary"
                                                aria-hidden="true"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        <select
                                            id="role_ID"
                                            name="role_ID"
                                            value={roleId}
                                            onChange={(event) =>
                                                setRoleId(event.target.value)
                                            }
                                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                            required
                                            aria-invalid={Boolean(
                                                errors.role_ID,
                                            )}
                                        >
                                            {roles.map((role) => (
                                                <option
                                                    key={role.role_ID}
                                                    value={role.role_ID}
                                                >
                                                    {roleLabels[
                                                        role.role_name
                                                    ] ?? role.role_name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.role_ID} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="branch_ID">
                                            Branch
                                            {!isSuperAdmin && (
                                                <span
                                                    className="text-primary"
                                                    aria-hidden="true"
                                                >
                                                    *
                                                </span>
                                            )}
                                        </Label>
                                        <select
                                            id="branch_ID"
                                            name="branch_ID"
                                            defaultValue={
                                                staffAccount?.branch_ID ?? ''
                                            }
                                            disabled={isSuperAdmin}
                                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                            required={!isSuperAdmin}
                                            aria-invalid={Boolean(
                                                errors.branch_ID,
                                            )}
                                        >
                                            <option value="">
                                                {isSuperAdmin
                                                    ? 'All branches'
                                                    : 'Select a branch'}
                                            </option>
                                            {branches.map((branch) => (
                                                <option
                                                    key={branch.branch_ID}
                                                    value={branch.branch_ID}
                                                >
                                                    {branch.branch_name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.branch_ID}
                                        />
                                    </div>

                                    {isEdit && (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="password">
                                                    New password
                                                </Label>
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    placeholder="Leave blank to keep current"
                                                    aria-invalid={Boolean(
                                                        errors.password,
                                                    )}
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="password_confirmation">
                                                    Confirm new password
                                                </Label>
                                                <Input
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    type="password"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </>
                                    )}
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
                                              ? 'Update staff'
                                              : 'Add staff'}
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
