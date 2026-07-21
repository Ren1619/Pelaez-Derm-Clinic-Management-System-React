import { Badge } from '@/components/ui/badge';
import type { ProductBatch } from '@/types';

export function formatInventoryDate(date: string | null): string {
    if (!date) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

export function formatInventoryPrice(price: string): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(price));
}

export function ExpirationBadge({
    product,
}: {
    product: Pick<ProductBatch, 'days_until_expiration' | 'expiration_status'>;
}) {
    if (
        product.expiration_status === null ||
        product.days_until_expiration === null
    ) {
        return null;
    }

    if (product.expiration_status === 'expired') {
        const daysAgo = Math.abs(product.days_until_expiration);

        return (
            <Badge variant="destructive">
                Expired {daysAgo} day{daysAgo === 1 ? '' : 's'} ago
            </Badge>
        );
    }

    return (
        <Badge className="border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Expires in {product.days_until_expiration} day
            {product.days_until_expiration === 1 ? '' : 's'}
        </Badge>
    );
}
