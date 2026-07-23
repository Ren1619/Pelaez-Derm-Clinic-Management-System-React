import { Head, router, usePoll } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import { DataTableLayout } from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import {
    markNewRecordSeen,
    NewRecordBadge,
    newRecordRowClass,
} from '@/components/new-record-indicator';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
        markNewRecordSeen(feedback, 'feedback');
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
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center">
                        <div className="relative w-full sm:w-80">
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
                            <SelectTrigger className="w-full sm:w-36">
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
                            <SelectTrigger className="w-full sm:w-40">
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
                            <SelectTrigger className="w-full sm:w-48">
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

                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                        <div className="flex flex-wrap items-center gap-2">
                            <FeedbackDateRangePicker
                                key={`${filters.date_from ?? 'all'}:${filters.date_to ?? 'all'}`}
                                filters={filters}
                                onChange={visit}
                            />
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

function FeedbackDateRangePicker({
    filters,
    onChange,
}: {
    filters: Pick<FeedbackFilters, 'date_from' | 'date_to'>;
    onChange: (changes: Partial<FeedbackFilters>) => void;
}) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
        feedbackDateRange(filters),
    );
    const [open, setOpen] = useState(false);

    const selectDateRange = (range: DateRange | undefined) => {
        setDateRange(range);

        if (!range?.from || !range.to) {
            return;
        }

        setOpen(false);
        onChange({
            date_from: format(range.from, 'yyyy-MM-dd'),
            date_to: format(range.to, 'yyyy-MM-dd'),
            all_dates: false,
        });
    };

    const showAllDates = () => {
        setDateRange(undefined);
        setOpen(false);
        onChange({
            date_from: null,
            date_to: null,
            all_dates: true,
        });
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal sm:w-auto sm:min-w-72"
                        aria-label="Select feedback date range"
                    >
                        <CalendarDays className="size-4" />
                        {formatDateRange(dateRange)}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="max-h-[min(38rem,calc(100vh-2rem))] w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0"
                >
                    <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={selectDateRange}
                        numberOfMonths={2}
                        resetOnSelect
                        autoFocus
                    />
                </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" onClick={showAllDates}>
                All dates
            </Button>
        </>
    );
}

const feedbackDateRange = (
    filters: Pick<FeedbackFilters, 'date_from' | 'date_to'>,
): DateRange | undefined => {
    if (!filters.date_from && !filters.date_to) {
        return undefined;
    }

    return {
        from: filters.date_from ? parseISO(filters.date_from) : undefined,
        to: filters.date_to ? parseISO(filters.date_to) : undefined,
    };
};

const formatDateRange = (range: DateRange | undefined): string => {
    if (!range?.from) {
        return 'All dates';
    }

    if (!range.to) {
        return format(range.from, 'MMM d, yyyy');
    }

    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
};

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
                        <TableRow
                            key={feedback.feedback_ID}
                            className={newRecordRowClass(feedback)}
                        >
                            <TableCell>
                                <button
                                    type="button"
                                    className="font-medium hover:underline"
                                    onClick={() => onView(feedback)}
                                >
                                    {appointment.appointment_code}
                                </button>
                                {feedback.is_new && (
                                    <NewRecordBadge className="ml-2" />
                                )}
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
                                <TooltipIconButton
                                    variant="ghost"
                                    size="icon"
                                    tooltip="View feedback"
                                    onClick={() => onView(feedback)}
                                    aria-label="View feedback"
                                >
                                    <Eye />
                                </TooltipIconButton>
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
