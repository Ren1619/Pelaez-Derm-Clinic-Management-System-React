export function PublicPageTitle({ title }: { title: string }) {
    const [titleLead, titleAccent] = splitTitle(title);

    return (
        <section className="bg-background">
            <div className="mx-auto flex min-h-0 max-w-7xl items-center justify-center px-4 py-4 sm:min-h-64 sm:px-6 sm:py-14 lg:px-8">
                <h1 className="inline-flex max-w-full items-baseline justify-center gap-2 text-center leading-none text-balance sm:gap-3">
                    {titleLead && (
                        <span className="relative pb-2 font-sans text-sm font-black tracking-[0.24em] text-amber-700 uppercase after:absolute after:bottom-0 after:left-0 after:h-px after:w-6 after:bg-amber-500 sm:text-lg lg:text-xl dark:text-amber-300">
                            {titleLead}
                        </span>
                    )}
                    <span className="font-serif text-4xl font-normal tracking-tight text-primary italic sm:text-5xl lg:text-6xl">
                        {titleAccent}
                    </span>
                </h1>
            </div>
        </section>
    );
}

function splitTitle(title: string): [string, string] {
    const words = title.trim().split(/\\s+/);
    const accent = words.pop();

    return [words.join(' '), accent ?? title];
}
