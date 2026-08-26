import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children, title }: AuthLayoutProps) {
    return (
        <main className="flex min-h-svh items-center justify-center bg-[#fcfaf7] px-3 py-5 text-foreground sm:px-4 sm:py-8 dark:bg-background">
            <section className="w-full max-w-md bg-background/95 shadow-[0_24px_70px_-42px_rgba(24,19,16,0.45)] backdrop-blur dark:bg-card">
                <div className="px-4 pt-6 sm:px-5 sm:pt-7">
                    <h1 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
                        {title}
                    </h1>
                </div>
                <div className="px-4 py-5 sm:px-5 sm:py-6">{children}</div>
            </section>
        </main>
    );
}


