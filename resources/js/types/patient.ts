export type Patient = {
    PID: number;
    name?: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    full_name: string;
    email: string;
    email_verified_at: string | null;
    contact_number: string;
    address: string;
    sex: 'Male' | 'Female';
    date_of_birth: string;
    age: number;
    civil_status: 'Single' | 'Married' | 'Divorced' | 'Widowed';
    created_at: string | null;
    last_visit_at: string | null;
};

export type PatientFilters = {
    search: string;
    verification: 'verified' | 'unverified' | null;
    per_page: number;
};

export type PatientPaginator = {
    data: Patient[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type PatientSummary = {
    total: number;
    verified: number;
    unverified: number;
};

export type PatientDialogMode = 'create' | 'edit' | 'view';

export type PatientAllergy = {
    allergy_ID: number;
    allergy: string;
    note: string | null;
};

export type PatientMedicalCondition = {
    medical_condition_ID: number;
    condition: string;
    note: string | null;
};

export type PatientMedication = {
    medication_ID: number;
    medication: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    note: string | null;
};

export type PatientMedicalRecord = {
    allergies: PatientAllergy[];
    medical_conditions: PatientMedicalCondition[];
    medications: PatientMedication[];
};

export type PatientVisitService = {
    visit_service_ID: number;
    service_ID: number | null;
    service_name: string;
    quantity: number;
    note: string | null;
};

export type PatientVisitProduct = {
    visit_product_ID: number;
    product_ID: number | null;
    product_name: string;
    quantity: number;
    unit_price: string | null;
    note: string | null;
};

export type PatientVisitDiagnosis = {
    diagnosis_ID: number;
    diagnosis: string;
    note: string | null;
};

export type PatientVisitPrescription = {
    prescription_ID: number;
    prescription: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    note: string | null;
};

export type PatientVisit = {
    visit_ID: number;
    branch: {
        branch_ID: number | null;
        branch_name: string;
    };
    doctor: {
        account_ID: number | null;
        name: string | null;
    };
    visited_at: string;
    blood_pressure: string | null;
    weight: string | null;
    height: string | null;
    status: string;
    finalized_at: string | null;
    services: PatientVisitService[];
    products: PatientVisitProduct[];
    diagnoses: PatientVisitDiagnosis[];
    prescriptions: PatientVisitPrescription[];
};

export type PatientVisitPaginator = {
    data: PatientVisit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type PatientRecordFilters = {
    per_page: number;
    date_from: string | null;
    date_to: string | null;
};

export type PatientPosTransaction = {
    sale_ID: number;
    invoice_number: string;
    branch_name: string;
    created_at: string;
    total_cost: string;
    total_returned: string;
    is_voided: boolean;
    products: Array<{
        item_ID: number;
        name: string;
        quantity: number;
        subtotal: string;
    }>;
    services: Array<{
        item_ID: number;
        name: string;
        quantity: number;
        subtotal: string;
    }>;
};

export type PatientClinicalOptions = {
    branches: Array<{ id: number; name: string }>;
    doctors: Array<{ id: number; name: string; branch_ID: number | null }>;
    services: Array<{ id: number; name: string }>;
    products: Array<{
        id: number;
        name: string;
        branch_ID: number;
        price: string;
        quantity: number;
    }>;
};

export type PatientSummaryRecord =
    PatientAllergy | PatientMedicalCondition | PatientMedication;

export type PatientVisitRecord =
    | PatientVisitDiagnosis
    | PatientVisitPrescription
    | PatientVisitService
    | PatientVisitProduct;
