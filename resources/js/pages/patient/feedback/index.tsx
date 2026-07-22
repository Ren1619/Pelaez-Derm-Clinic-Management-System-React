import { Form, Head, router } from '@inertiajs/react';
import { CalendarClock, MessageSquareText, Star } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { StarRating } from '@/pages/feedback/components/feedback-dialogs';
import { index, store } from '@/routes/patient/feedback';
import type { Feedback, FeedbackAppointment, FeedbackPaginator } from '@/types';

type Props = {
    patient: { PID: number; name: string; email: string };
    pendingAppointments: FeedbackAppointment[];
    feedbacks: FeedbackPaginator;
};

export default function PatientFeedback({
    pendingAppointments,
    feedbacks,
}: Props) {
    const [activeTab, setActiveTab] = useState<'pending' | 'feedbacks'>(
        'pending',
    );
    const [selectedAppointment, setSelectedAppointment] =
        useState<FeedbackAppointment | null>(null);

    return (
        <>
            <Head title="My feedback" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">My feedback</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review your completed visits and share your clinic
                        experience.
                    </p>
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="border-b px-4">
                        <nav className="flex gap-6" aria-label="Feedback tabs">
                            <TabButton
                                active={activeTab === 'pending'}
                                onClick={() => setActiveTab('pending')}
                            >
                                Pending feedback ({pendingAppointments.length})
                            </TabButton>
                            <TabButton
                                active={activeTab === 'feedbacks'}
                                onClick={() => setActiveTab('feedbacks')}
                            >
                                My feedbacks ({feedbacks.total})
                            </TabButton>
                        </nav>
                    </div>

                    {activeTab === 'pending' ? (
                        <PendingAppointments
                            appointments={pendingAppointments}
                            onReview={setSelectedAppointment}
                        />
                    ) : (
                        <SubmittedFeedback feedbacks={feedbacks} />
                    )}
                </Card>
            </div>

            <CreateFeedbackDialog
                key={selectedAppointment?.appointment_ID ?? 'none'}
                appointment={selectedAppointment}
                open={selectedAppointment !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedAppointment(null);
                    }
                }}
            />
        </>
    );
}

function PendingAppointments({
    appointments,
    onReview,
}: {
    appointments: FeedbackAppointment[];
    onReview: (appointment: FeedbackAppointment) => void;
}) {
    if (appointments.length === 0) {
        return (
            <EmptyState message="No pending feedback. All completed appointments have been reviewed." />
        );
    }

    return (
        <div className="divide-y">
            {appointments.map((appointment) => (
                <div
                    key={appointment.appointment_ID}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <AppointmentSummary appointment={appointment} />
                    <Button onClick={() => onReview(appointment)}>
                        Leave feedback
                    </Button>
                </div>
            ))}
        </div>
    );
}

function SubmittedFeedback({ feedbacks }: { feedbacks: FeedbackPaginator }) {
    if (feedbacks.data.length === 0) {
        return <EmptyState message="No feedback submitted yet." />;
    }

    return (
        <>
            <div className="divide-y">
                {feedbacks.data.map((feedback: Feedback) => (
                    <div key={feedback.feedback_ID} className="space-y-4 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <AppointmentSummary
                                appointment={feedback.appointment}
                            />
                            <StarRating rating={feedback.rating} />
                        </div>
                        <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                            {feedback.description || 'No comments provided.'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Submitted{' '}
                            {new Date(feedback.submitted_at).toLocaleDateString(
                                [],
                                {
                                    dateStyle: 'long',
                                },
                            )}
                        </p>
                    </div>
                ))}
            </div>
            {feedbacks.last_page > 1 && (
                <div className="flex items-center justify-end gap-2 border-t p-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={feedbacks.current_page <= 1}
                        onClick={() =>
                            router.get(index.url(), {
                                page: feedbacks.current_page - 1,
                            })
                        }
                    >
                        Previous
                    </Button>
                    <span className="text-sm">
                        {feedbacks.current_page} / {feedbacks.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={feedbacks.current_page >= feedbacks.last_page}
                        onClick={() =>
                            router.get(index.url(), {
                                page: feedbacks.current_page + 1,
                            })
                        }
                    >
                        Next
                    </Button>
                </div>
            )}
        </>
    );
}

function CreateFeedbackDialog({
    appointment,
    open,
    onOpenChange,
}: {
    appointment: FeedbackAppointment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);

    if (!appointment) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Leave feedback</DialogTitle>
                    <DialogDescription>
                        Rate this completed appointment and optionally share a
                        comment.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    onSuccess={() => onOpenChange(false)}
                    className="grid gap-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="appointment_ID"
                                value={appointment.appointment_ID}
                            />
                            <input type="hidden" name="rating" value={rating} />
                            <AppointmentSummary appointment={appointment} />

                            <div className="grid gap-2">
                                <Label>Rating</Label>
                                <div
                                    className="flex items-center gap-1"
                                    onMouseLeave={() => setHoveredRating(0)}
                                >
                                    {Array.from({ length: 5 }, (_, index) => {
                                        const value = index + 1;
                                        const active =
                                            value <= (hoveredRating || rating);

                                        return (
                                            <Tooltip key={value}>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setRating(value)
                                                        }
                                                        onMouseEnter={() =>
                                                            setHoveredRating(
                                                                value,
                                                            )
                                                        }
                                                        className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                        aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                                    >
                                                        <Star
                                                            className={`size-9 ${active ? 'fill-current text-foreground' : 'text-muted-foreground/35'}`}
                                                        />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {value} star
                                                    {value === 1 ? '' : 's'}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                    <span className="ml-2 font-medium">
                                        {rating}/5
                                    </span>
                                </div>
                                <InputError message={errors.rating} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="feedback-description">
                                    Comments (optional)
                                </Label>
                                <textarea
                                    id="feedback-description"
                                    name="description"
                                    rows={5}
                                    maxLength={1000}
                                    placeholder="Share your experience…"
                                    className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <InputError message={errors.description} />
                                <InputError message={errors.appointment_ID} />
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
                                    {processing
                                        ? 'Submitting…'
                                        : 'Submit feedback'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function AppointmentSummary({
    appointment,
}: {
    appointment: FeedbackAppointment;
}) {
    const details =
        appointment.appointment_type === 'consultation'
            ? appointment.concern || 'No concern provided'
            : appointment.services
                  .map((service) => service.service_name)
                  .join(', ') || 'No services listed';

    return (
        <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                    {appointment.appointment_code}
                </span>
                <Badge variant="outline" className="capitalize">
                    {appointment.appointment_type}
                </Badge>
            </div>
            <p className="text-sm">{details}</p>
            <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                {new Date(appointment.scheduled_at).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                })}
                <span>· {appointment.branch_name}</span>
                {appointment.visit_ID && (
                    <span>· Visit #{appointment.visit_ID}</span>
                )}
            </p>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
            {children}
        </button>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <MessageSquareText className="size-8" />
            <p className="text-sm">{message}</p>
        </div>
    );
}
