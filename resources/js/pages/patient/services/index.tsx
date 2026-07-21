import { Head, Link, router } from '@inertiajs/react';
import { CalendarPlus, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { index as appointmentsIndex } from '@/routes/patient/appointments';
import { index } from '@/routes/patient/services';

type ServiceCard = { id: number; name: string; description: string; category: string | null; image_url: string | null };
type Props = {
    patient: { PID: number; name: string; email: string };
    services: ServiceCard[];
    categories: Array<{ category_ID: number; category_name: string }>;
    filters: { search: string; category_ID: number | null };
};

export default function PatientServices({ services, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const apply = (changes: Record<string, string | number | null>) => router.get(index.url(), { ...filters, ...changes }, { preserveState: true, replace: true });

    return <>
        <Head title="Clinic Services" />
        <div className="space-y-6">
            <div><h2 className="text-2xl font-semibold">Clinic Services</h2><p className="mt-1 text-sm text-muted-foreground">Explore dermatology services offered by the clinics and book one directly.</p></div>

            <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
                <label className="grid min-w-0 flex-1 gap-1 text-sm"><span className="text-muted-foreground">Search services</span><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && apply({ search })} className="pl-9" placeholder="Search by service name or description" /></div></label>
                <label className="grid gap-1 text-sm"><span className="text-muted-foreground">Category</span><Select value={filters.category_ID ? String(filters.category_ID) : 'all'} onValueChange={(value) => apply({ category_ID: value === 'all' ? null : Number(value) })}><SelectTrigger className="w-full md:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((category) => <SelectItem key={category.category_ID} value={String(category.category_ID)}>{category.category_name}</SelectItem>)}</SelectContent></Select></label>
                <Button variant="outline" onClick={() => apply({ search })}>Search</Button>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{services.map((service) => <article key={service.id} className="flex overflow-hidden rounded-xl border bg-card shadow-sm sm:flex-col">{service.image_url ? <img src={service.image_url} alt="" className="h-44 w-36 object-cover sm:w-full" /> : <div className="flex h-44 w-36 shrink-0 items-center justify-center bg-muted sm:w-full"><Sparkles className="size-10 text-muted-foreground/50" /></div>}<div className="flex min-w-0 flex-1 flex-col p-5"><p className="text-xs font-medium uppercase tracking-wide text-primary">{service.category}</p><h3 className="mt-1 text-lg font-semibold">{service.name}</h3><p className="mt-3 line-clamp-4 flex-1 text-sm leading-6 text-muted-foreground">{service.description}</p><Button asChild className="mt-5 w-full"><Link href={appointmentsIndex({ query: { service_ID: service.id } })}><CalendarPlus /> Book Now</Link></Button></div></article>)} </div>
            {services.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">No services match your filters.</div>}
        </div>
    </>;
}
