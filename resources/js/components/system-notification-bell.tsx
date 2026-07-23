import { router, usePage, usePoll } from '@inertiajs/react';
import {
    Bell,
    CalendarClock,
    CheckCheck,
    MessageSquareText,
    PackageMinus,
    Truck,
} from 'lucide-react';
import {
    read as readStaffNotification,
    readAll as readAllStaffNotifications,
} from '@/actions/App/Http/Controllers/NotificationController';
import {
    read as readPatientNotification,
    readAll as readAllPatientNotifications,
} from '@/actions/App/Http/Controllers/PatientNotificationController';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index as appointmentsIndex } from '@/routes/appointments';
import { index as distributionsIndex } from '@/routes/distributions';
import { index as feedbackIndex } from '@/routes/feedback';
import { index as inventoryIndex } from '@/routes/inventory';
import { index as patientAppointmentsIndex } from '@/routes/patient/appointments';
import type {
    Auth,
    NotificationSummary,
    SystemNotificationItem,
} from '@/types';

type Audience = 'staff' | 'patient';

function notificationIcon(type: SystemNotificationItem['type']) {
    if (type === 'inventory_low_stock') {
        return PackageMinus;
    }

    if (type.startsWith('distribution_')) {
        return Truck;
    }

    if (type === 'feedback_submitted') {
        return MessageSquareText;
    }

    return CalendarClock;
}

function formattedDate(value: string | null): string {
    if (value === null) {
        return '';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function targetFor(
    notification: SystemNotificationItem,
    audience: Audience,
    auth: Auth,
): string | null {
    if (audience === 'patient') {
        return patientAppointmentsIndex().url;
    }

    if (notification.type.startsWith('appointment_')) {
        return auth.permissions.modules.includes('appointments')
            ? appointmentsIndex().url
            : null;
    }

    if (notification.type === 'inventory_low_stock') {
        return auth.permissions.modules.includes('inventory')
            ? inventoryIndex({ query: { status: 'low-stock' } }).url
            : null;
    }

    if (notification.type.startsWith('distribution_')) {
        return auth.permissions.modules.includes('distribution')
            ? distributionsIndex({
                  query: {
                      tab:
                          notification.type === 'distribution_inbound'
                              ? 'inbound'
                              : 'outbound',
                  },
              }).url
            : null;
    }

    if (notification.type === 'feedback_submitted') {
        return auth.permissions.modules.includes('feedback')
            ? feedbackIndex().url
            : null;
    }

    return null;
}

export function SystemNotificationBell({ audience }: { audience: Audience }) {
    const { notificationSummary, auth } = usePage<{
        notificationSummary: NotificationSummary;
        auth: Auth;
    }>().props;
    usePoll(
        5000,
        {
            only:
                audience === 'staff'
                    ? ['notificationSummary', 'newRecordSummary']
                    : ['notificationSummary'],
        },
        { mode: 'rest' },
    );

    const markRead = (notification: SystemNotificationItem) => {
        const target = targetFor(notification, audience, auth);

        if (notification.is_read) {
            if (target !== null) {
                router.visit(target);
            }

            return;
        }

        const action =
            audience === 'patient'
                ? readPatientNotification
                : readStaffNotification;

        router.patch(
            action.url(notification.id),
            {},
            {
                preserveScroll: true,
                only: ['notificationSummary'],
                onSuccess: () => {
                    if (target !== null) {
                        router.visit(target);
                    }
                },
            },
        );
    };

    const markAllRead = () => {
        const action =
            audience === 'patient'
                ? readAllPatientNotifications
                : readAllStaffNotifications;

        router.patch(
            action.url(),
            {},
            {
                preserveScroll: true,
                only: ['notificationSummary'],
            },
        );
    };

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            aria-label={`Notifications${notificationSummary.unread_count > 0 ? `, ${notificationSummary.unread_count} unseen` : ''}`}
                        >
                            <Bell className="size-5" />
                            {notificationSummary.unread_count > 0 && (
                                <span className="absolute top-0 right-0 flex min-w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-linear-to-br from-brand-bright via-brand-mid to-brand-deep px-1 text-[10px] font-bold text-white">
                                    {notificationSummary.unread_count > 99
                                        ? '99+'
                                        : notificationSummary.unread_count}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
                align="end"
                className="w-[min(24rem,calc(100vw-2rem))] p-0"
            >
                <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="p-0">
                        Notifications
                    </DropdownMenuLabel>
                    {notificationSummary.unread_count > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={markAllRead}
                        >
                            <CheckCheck className="size-4" /> Mark all seen
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[26rem] overflow-y-auto p-1">
                    {notificationSummary.items.map((notification) => {
                        const Icon = notificationIcon(notification.type);

                        return (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`items-start gap-3 p-3 ${notification.is_read ? '' : 'bg-primary/5'}`}
                                onSelect={() => markRead(notification)}
                            >
                                <span className="mt-0.5 rounded-full bg-muted p-2">
                                    <Icon className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1 space-y-1">
                                    <span className="flex items-start gap-2">
                                        <span className="flex-1 font-medium">
                                            {notification.title}
                                        </span>
                                        {!notification.is_read && (
                                            <span className="mt-1.5 size-2 rounded-full bg-primary" />
                                        )}
                                    </span>
                                    <span className="block text-xs leading-relaxed text-muted-foreground">
                                        {notification.message}
                                    </span>
                                    <span className="block text-[11px] text-muted-foreground">
                                        {formattedDate(notification.created_at)}
                                    </span>
                                </span>
                            </DropdownMenuItem>
                        );
                    })}
                    {notificationSummary.items.length === 0 && (
                        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                            No important notifications right now.
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
