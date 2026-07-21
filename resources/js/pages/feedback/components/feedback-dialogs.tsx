import { CalendarClock, MessageSquareText, Star } from 'lucide-react';
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
import type { Feedback, FeedbackAppointment } from '@/types';

export function FeedbackDetailsDialog({
    feedback,
    open,
    onOpenChange,
}: {
    feedback: Feedback | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!feedback) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquareText className="size-5" />
                        Feedback details
                    </DialogTitle>
                    <DialogDescription>
                        Submitted{' '}
                        {new Date(feedback.submitted_at).toLocaleDateString(
                            [],
                            {
                                dateStyle: 'long',
                            },
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5">
                    <AppointmentSummary appointment={feedback.appointment} />
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium">Rating</span>
                            <StarRating rating={feedback.rating} />
                        </div>
                        <div className="mt-4 border-t pt-4">
                            <p className="text-xs text-muted-foreground">
                                Comments
                            </p>
                            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                                {feedback.description ||
                                    'No comments provided.'}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AppointmentSummary({
    appointment,
}: {
    appointment: FeedbackAppointment;
}) {
    const subject =
        appointment.appointment_type === 'consultation'
            ? appointment.concern
            : appointment.services
                  .map((service) => service.service_name)
                  .join(', ');

    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-medium">{appointment.patient_name}</p>
                    <p className="text-sm text-muted-foreground">
                        {appointment.appointment_code} ·{' '}
                        {appointment.branch_name}
                    </p>
                </div>
                <Badge variant="outline" className="capitalize">
                    {appointment.appointment_type}
                </Badge>
            </div>
            <p className="mt-3 text-sm">{subject || 'No details provided.'}</p>
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                {new Date(appointment.scheduled_at).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                })}
                {appointment.visit_ID
                    ? ` · Visit #${appointment.visit_ID}`
                    : ''}
            </p>
        </div>
    );
}

export function StarRating({ rating }: { rating: number }) {
    return (
        <span
            className="flex items-center gap-0.5"
            aria-label={`${rating} out of 5 stars`}
        >
            {Array.from({ length: 5 }, (_, index) => (
                <Star
                    key={index}
                    className={`size-4 ${index < rating ? 'fill-current text-foreground' : 'text-muted-foreground/30'}`}
                />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">
                ({rating})
            </span>
        </span>
    );
}
