export type SystemSettings = {
    business_name: string;
    business_logo: string | null;
    business_logo_url: string | null;
    landing_primary_tagline: string;
    landing_secondary_tagline: string;
    landing_year_started: number;
    landing_hero_image: string | null;
    landing_hero_image_url: string | null;
    landing_about_image: string | null;
    landing_about_image_url: string | null;
    landing_about_description: string;
    landing_specializations: string[];
    landing_services_description: string;
    landing_branches_description: string;
    landing_contact_description: string;
    business_email: string;
    landing_cta_title: string;
    landing_cta_description: string;
    footer_days: string;
    footer_opens_at: string;
    footer_closes_at: string;
    services_hero_image: string | null;
    services_hero_image_url: string | null;
    services_hero_description: string | null;
    services_title: string;
    services_description: string | null;
    branches_hero_image: string | null;
    branches_hero_image_url: string | null;
    branches_hero_description: string | null;
    branches_title: string;
    branches_description: string | null;
    privacy_hero_image: string | null;
    privacy_hero_image_url: string | null;
    privacy_hero_description: string | null;
    privacy_title: string;
    privacy_description: string | null;
};

export type PublicService = {
    id: number;
    name: string;
    description: string;
    category: string | null;
    major_category: string | null;
    image_url: string | null;
};

export type PublicBranch = {
    id: number;
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    contact_number: string;
    map_link: string;
    facebook_link: string | null;
    image_url: string | null;
};

export type LandingStats = {
    years_experience: number;
    branch_count: number;
    service_count: number;
};
