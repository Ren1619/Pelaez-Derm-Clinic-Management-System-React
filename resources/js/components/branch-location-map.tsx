import L from 'leaflet';
import type { LeafletMouseEvent, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type Coordinates = {
    latitude: number;
    longitude: number;
};

type BranchLocationMapProps = {
    latitude?: number | null;
    longitude?: number | null;
    interactive?: boolean;
    onChange?: (coordinates: Coordinates) => void;
    className?: string;
};

const DEFAULT_CENTER: [number, number] = [7.9075, 125.0942];

/** Displays a branch pin and optionally lets staff move it. */
export default function BranchLocationMap({
    latitude,
    longitude,
    interactive = false,
    onChange,
    className,
}: BranchLocationMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const hasPin =
            latitude !== null &&
            latitude !== undefined &&
            longitude !== null &&
            longitude !== undefined;
        const initialPosition: [number, number] = hasPin
            ? [latitude, longitude]
            : DEFAULT_CENTER;
        const map = L.map(containerRef.current, {
            center: initialPosition,
            zoom: hasPin ? 16 : 13,
            scrollWheelZoom: interactive,
            dragging: interactive,
            doubleClickZoom: interactive,
            boxZoom: interactive,
            keyboard: interactive,
            touchZoom: interactive,
            zoomControl: true,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const pinIcon = L.divIcon({
            className: '',
            html: '<span style="display:block;width:22px;height:22px;border:3px solid white;border-radius:9999px;background:#ec4899;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
        });
        let marker: Marker | null = null;

        /** Creates or moves the branch marker and reports its coordinates. */
        const placeMarker = (coordinates: Coordinates, notify = true) => {
            const position: [number, number] = [
                coordinates.latitude,
                coordinates.longitude,
            ];

            if (marker) {
                marker.setLatLng(position);
            } else {
                marker = L.marker(position, {
                    icon: pinIcon,
                    draggable: interactive,
                    title: 'Branch location',
                    alt: 'Branch location pin',
                }).addTo(map);

                if (interactive) {
                    marker.on('dragend', () => {
                        const position = marker?.getLatLng();

                        if (position) {
                            onChangeRef.current?.({
                                latitude: position.lat,
                                longitude: position.lng,
                            });
                        }
                    });
                }
            }

            if (notify) {
                onChangeRef.current?.(coordinates);
            }
        };

        if (hasPin) {
            placeMarker(
                {
                    latitude: latitude as number,
                    longitude: longitude as number,
                },
                false,
            );
        }

        if (interactive) {
            map.on('click', (event: LeafletMouseEvent) => {
                placeMarker({
                    latitude: event.latlng.lat,
                    longitude: event.latlng.lng,
                });
            });
        }

        // Dialog animations can change the container size after initialization.
        window.setTimeout(() => map.invalidateSize(), 100);

        return () => {
            map.remove();
        };
    }, [interactive, latitude, longitude]);

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative z-0 h-64 w-full overflow-hidden rounded-lg border bg-muted',
                className,
            )}
            aria-label={
                interactive
                    ? 'Click the map to pin the branch location'
                    : 'Branch location map'
            }
        />
    );
}
