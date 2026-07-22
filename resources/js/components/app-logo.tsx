import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { branding } = usePage<{
        branding: { name: string; logo_url: string | null };
    }>().props;

    return (
        <>
            <div
                className={cn(
                    'flex aspect-square size-8 items-center justify-center rounded-md',
                    branding.logo_url
                        ? 'bg-transparent'
                        : 'bg-sidebar-primary text-sidebar-primary-foreground',
                )}
            >
                {branding.logo_url ? (
                    <img
                        src={branding.logo_url}
                        alt=""
                        className="size-7 rounded object-contain"
                    />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {branding.name}
                </span>
            </div>
        </>
    );
}
