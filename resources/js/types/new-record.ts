import type { Auth } from './auth';

export type TrackableStaffModule = Extract<
    Auth['permissions']['modules'][number],
    | 'appointments'
    | 'patients'
    | 'inventory'
    | 'point_of_sale'
    | 'services'
    | 'categories'
    | 'staff'
    | 'branches'
    | 'distribution'
    | 'feedback'
>;

export type NewRecordTracked = {
    is_new: boolean;
    new_record_event_id: number | null;
};

export type NewRecordSummary = {
    counts: Partial<Record<TrackableStaffModule, number>>;
    total_count: number;
};
