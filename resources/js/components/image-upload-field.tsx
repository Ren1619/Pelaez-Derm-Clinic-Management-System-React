import { usePage } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ImageUploadFieldProps = {
    id: string;
    label: string;
    accept: string;
    helpText: string;
    existingImageUrl?: string | null;
    imageAlt: string;
    error?: string;
    progress?: number;
};

/** Displays a clickable image upload area with an immediate local preview. */
export default function ImageUploadField({
    id,
    label,
    accept,
    helpText,
    existingImageUrl,
    imageAlt,
    error,
    progress,
}: ImageUploadFieldProps) {
    const { branding } = usePage<{
        branding?: { logo_url: string | null };
    }>().props;
    const [previewUrl, setPreviewUrl] = useState(existingImageUrl ?? null);
    const objectUrl = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (objectUrl.current) {
                URL.revokeObjectURL(objectUrl.current);
            }
        };
    }, []);

    /** Replaces the preview and releases the previous temporary browser URL. */
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedImage = event.target.files?.[0];

        if (objectUrl.current) {
            URL.revokeObjectURL(objectUrl.current);
            objectUrl.current = null;
        }

        if (!selectedImage) {
            setPreviewUrl(existingImageUrl ?? null);

            return;
        }

        objectUrl.current = URL.createObjectURL(selectedImage);
        setPreviewUrl(objectUrl.current);
    };

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <label
                htmlFor={id}
                className={cn(
                    'group relative flex h-52 cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 hover:border-pink-400 hover:shadow-md',
                    previewUrl ? 'border-solid' : 'border-dashed',
                )}
            >
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={imageAlt}
                        className="size-full object-cover"
                    />
                ) : (
                    <span className="flex size-full items-center justify-center bg-linear-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-950/40 dark:via-purple-950/30 dark:to-indigo-950/40">
                        <span className="flex size-16 items-center justify-center rounded-full border border-white/80 bg-white/75 p-3 text-neutral-700 shadow-sm backdrop-blur-sm dark:border-white/15 dark:bg-black/25 dark:text-white">
                            {branding?.logo_url ? (
                                <img
                                    src={branding.logo_url}
                                    alt="Clinic logo"
                                    className="size-full object-contain"
                                />
                            ) : (
                                <AppLogoIcon className="size-9 fill-current" />
                            )}
                        </span>
                    </span>
                )}

                <span
                    className={cn(
                        'absolute flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors',
                        previewUrl
                            ? 'inset-x-0 bottom-0 bg-black/65 group-hover:bg-pink-600/90'
                            : 'bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 group-hover:bg-pink-600/90',
                    )}
                >
                    <Upload className="size-4" />
                    Browse file
                </span>

                <input
                    id={id}
                    name="new_image"
                    type="file"
                    accept={accept}
                    onChange={handleImageChange}
                    className="sr-only"
                    aria-invalid={Boolean(error)}
                />
            </label>
            <p className="text-xs text-muted-foreground">{helpText}</p>
            <InputError message={error} />
            {progress !== undefined && (
                <progress value={progress} max="100" className="h-2 w-full">
                    {progress}%
                </progress>
            )}
        </div>
    );
}
