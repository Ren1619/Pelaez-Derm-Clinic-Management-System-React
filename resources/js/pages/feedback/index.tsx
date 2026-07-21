import { Head, router, usePoll } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/feedback';
import type {
    Feedback,
    FeedbackAppointment,
    FeedbackFilters,
    FeedbackPaginator,
} from '@/types';
import {
    FeedbackDetailsDialog,
    StarRating,
} from './components/feedback-dialogs';

type Props = {
    feedbacks: FeedbackPaginator;
    branches: Array<{ branch_ID: number; branch_name: string }>;
    filters: FeedbackFilters;
};

export default function FeedbackIndex({ feedbacks, branches, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
        null,
    );
    const [detailsOpen, setDetailsOpen] = useState(false);

    usePoll(10_000, {
        only: ['feedbacks'],
    });

    const visit = (changes: Partial<FeedbackFilters>, only?: string[]) => {
        const next = { ...filters, ...changes };

        router.get(
            index.url(),
            {
                search: next.search || undefined,
                date_from: next.date_from ?? undefined,
                date_to: next.date_to ?? undefined,
                all_dates: next.all_dates ? 1 : 0,
                rating: next.rating ?? undefined,
                appointment_type: next.appointment_type,
                branch_ID: next.branch_ID ?? undefined,
                per_page: next.per_page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only,
            },
        );
    };

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timer = window.setTimeout(
            () => visit({ search }, ['feedbacks', 'filters']),
            350,
        );

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openDetails = (feedback: Feedback) => {
        setSelectedFeedback(feedback);
        setDetailsOpen(true);
    };

    return (
        <>
            <Head title="Feedback" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Heading
                    title="Feedback"
                    description="Review feedback submitted by clinic patients."
                />

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="grid gap-3 border-b p-4 xl:grid-cols-[minmax(14rem,1fr)_9rem_11rem_12rem]">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search code, patient, service, or comment…"
                                className="pl-9"
                            />
                        </div>

                        <Select
                            value={filters.rating?.toString() ?? 'all'}
                            onValueChange={(value) =>
                                visit({
                                    rating:
                                        value === 'all' ? null : Number(value),
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All ratings" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All ratings</SelectItem>
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <SelectItem
                                        key={rating}
                                        value={String(rating)}
                                    >
                                        {rating} star{rating === 1 ? '' : 's'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.appointment_type}
                            onValueChange={(value) =>
                                visit({
                                    appointment_type:
                                        value as FeedbackFilters['appointment_type'],
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                <SelectItem value="consultation">
                                    Consultation
                                </SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={
                                filters.branch_ID
                                    ? String(filters.branch_ID)
                                    : 'all'
                            }
                            onValueChange={(value) =>
                                visit({
                                    branch_ID:
                                        value === 'all' ? null : Number(value),
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All clinics" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All clinics</SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem
                                        key={branch.branch_ID}
                                        value={String(branch.branch_ID)}
                                    >
                                        {branch.branch_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <Input
                                type="date"
                                value={filters.date_from ?? ''}
                                onChange={(event) =>
                                    visit({
                                        date_from: event.target.value || null,
                                        all_dates: false,
                                    })
                                }
                                className="w-auto"
                                aria-label="Feedback date from"
                            />
                            <span className="text-sm text-muted-foreground">
                                to
                            </span>
                            <Input
                                type="date"
                                value={filters.date_to ?? ''}
                                min={filters.date_from ?? undefined}
                                onChange={(event) =>
                                    visit({
                                        date_to: event.target.value || null,
                                        all_dates: false,
                                    })
                                }
                                className="w-auto"
                                aria-label="Feedback date to"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    visit({
                                        date_from: null,
                                        date_to: null,
                                        all_dates: true,
                                    })
                                }
                            >
                                All dates
                            </Button>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {filters.rating
                                ? `${feedbacks.total} matching ${filters.rating}-star reviews`
                                : `${feedbacks.total} submitted reviews`}
                        </div>
                    </div>

                    <FeedbackTable
                        feedbacks={feedbacks.data}
                        onView={openDetails}
                    />
                    <Pagination
                        paginator={feedbacks}
                        filters={filters}
                        visit={visit}
                    />
                </Card>
            </div>

            <FeedbackDetailsDialog
                feedback={selectedFeedback}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </>
    );
}

function FeedbackTable({
    feedbacks,
    onView,
}: {
    feedbacks: Feedback[];
    onView: (feedback: Feedback) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                    <tr>
                        <th className="px-4 py-3">Appointment</th>
                        <th className="px-4 py-3">Type / details</th>
                        <th className="px-4 py-3">Appointment date</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Comments</th>
                        <th className="px-4 py-3">Feedback date</th>
                        <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {feedbacks.map((feedback) => {
                        const appointment = feedback.appointment;
                        const details = appointmentDetails(appointment);

                        return (
                            <tr key={feedback.feedback_ID} className="border-t">
                                <td className="px-4 py-4">
                                    <button
                                        type="button"
                                        className="font-medium hover:underline"
                                        onClick={() => onView(feedback)}
                                    >
                                        {appointment.appointment_code}
                                    </button>
                                    <p className="text-xs text-muted-foreground">
                                        {appointment.patient_name} ·{' '}
                                        {appointment.branch_name}
                                    </p>
                                </td>
                                <td className="max-w-xs px-4 py-4">
                                    <Badge
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {appointment.appointment_type}
                                    </Badge>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {details}
                                    </p>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    {new Date(
                                        appointment.scheduled_at,
                                    ).toLocaleDateString([], {
                                        dateStyle: 'medium',
                                    })}
                                </td>
                                <td className="px-4 py-4">
                                    <StarRating rating={feedback.rating} />
                                </td>
                                <td className="max-w-sm px-4 py-4">
                                    <p className="line-clamp-2">
                                        {feedback.description || (
                                            <span className="text-muted-foreground italic">
                                                No comments
                                            </span>
                                        )}
                                    </p>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    {new Date(
                                        feedback.submitted_at,
                                    ).toLocaleDateString([], {
                                        dateStyle: 'medium',
                                    })}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onView(feedback)}
                                        aria-label="View feedback"
                                    >
                                        <Eye />
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                    {feedbacks.length === 0 && (
                        <tr>
                            <td
                                colSpan={7}
                                className="p-12 text-center text-muted-foreground"
                            >
                                No feedback matches these filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function Pagination({
    paginator,
    filters,
    visit,
}: {
    paginator: FeedbackPaginator;
    filters: FeedbackFilters;
    visit: (changes: Partial<FeedbackFilters>, only?: string[]) => void;
}) {
    const goToPage = (page: number) => {
        router.get(
            index.url(),
            { ...filters, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {paginator.from ?? 0}–{paginator.to ?? 0} of{' '}
                {paginator.total}
            </p>
            <div className="flex items-center gap-2">
                <Select
                    value={String(filters.per_page)}
                    onValueChange={(value) =>
                        visit({ per_page: Number(value) })
                    }
                >
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page <= 1}
                    onClick={() => goToPage(paginator.current_page - 1)}
                >
                    Previous
                </Button>
                <span className="text-sm">
                    {paginator.current_page} / {paginator.last_page}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page >= paginator.last_page}
                    onClick={() => goToPage(paginator.current_page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

const appointmentDetails = (appointment: FeedbackAppointment) =>
    appointment.appointment_type === 'consultation'
        ? appointment.concern || 'No concern provided'
        : appointment.services
              .map((service) => service.service_name)
              .join(', ') || 'No services listed';
