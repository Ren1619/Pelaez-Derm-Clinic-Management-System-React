import { useEffect, useState } from 'react';
import type { AppointmentTimeSlot } from '@/types';

type AvailabilityResponse = {
    slots: AppointmentTimeSlot[];
};

export function useAppointmentAvailability(
    availabilityUrl: string | null,
    defaultSlots: AppointmentTimeSlot[],
) {
    const [result, setResult] = useState<{
        url: string;
        slots: AppointmentTimeSlot[];
    } | null>(null);

    useEffect(() => {
        if (!availabilityUrl) {
            return;
        }

        const controller = new AbortController();

        void fetch(availabilityUrl, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Unable to load appointment availability.');
                }

                return response.json() as Promise<AvailabilityResponse>;
            })
            .then((response) =>
                setResult({ url: availabilityUrl, slots: response.slots }),
            )
            .catch((error: unknown) => {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setResult({ url: availabilityUrl, slots: defaultSlots });
            });

        return () => controller.abort();
    }, [availabilityUrl, defaultSlots]);

    return {
        slots:
            availabilityUrl && result?.url === availabilityUrl
                ? result.slots
                : defaultSlots,
        isLoading: availabilityUrl !== null && result?.url !== availabilityUrl,
    };
}
