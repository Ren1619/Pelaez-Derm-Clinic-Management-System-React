import { Head, router, usePoll } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import { DataTableLayout } from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

                <DataTableLayout>
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
                    <DataTablePagination
                        paginator={feedbacks}
                        itemLabel="feedback entries"
                        onPageChange={(page) =>
                            router.get(
                                index.url(),
                                { ...filters, page },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                },
                            )
                        }
                        onPerPageChange={(perPage) =>
                            visit({ per_page: perPage })
                        }
                    />
                </DataTableLayout>
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
        <Table className="min-w-6xl">
            <TableHeader>
                <TableRow>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Type / details</TableHead>
                    <TableHead>Appointment date</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Feedback date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {feedbacks.map((feedback) => {
                    const appointment = feedback.appointment;
                    const details = appointmentDetails(appointment);

                    return (
                        <TableRow key={feedback.feedback_ID}>
                            <TableCell>
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
                            </TableCell>
                            <TableCell className="max-w-xs">
                                <Badge variant="outline" className="capitalize">
                                    {appointment.appointment_type}
                                </Badge>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                    {details}
                                </p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {new Date(
                                    appointment.scheduled_at,
                                ).toLocaleDateString([], {
                                    dateStyle: 'medium',
                                })}
                            </TableCell>
                            <TableCell>
                                <StarRating rating={feedback.rating} />
                            </TableCell>
                            <TableCell className="max-w-sm">
                                <p className="line-clamp-2">
                                    {feedback.description || (
                                        <span className="text-muted-foreground italic">
                                            No comments
                                        </span>
                                    )}
                                </p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {new Date(
                                    feedback.submitted_at,
                                ).toLocaleDateString([], {
                                    dateStyle: 'medium',
                                })}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onView(feedback)}
                                    aria-label="View feedback"
                                >
                                    <Eye />
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
                {feedbacks.length === 0 && (
                    <DataTableEmptyState
                        colSpan={7}
                        title="No feedback found"
                        description="No feedback matches these filters."
                    />
                )}
            </TableBody>
        </Table>
    );
}

const appointmentDetails = (appointment: FeedbackAppointment) =>
    appointment.appointment_type === 'consultation'
        ? appointment.concern || 'No concern provided'
        : appointment.services
              .map((service) => service.service_name)
              .join(', ') || 'No services listed';
