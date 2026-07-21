<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ Str::headline(Str::lower($title)) }} - {{ config('app.name') }}</title>

        @fonts
        @vite(['resources/css/app.css', 'resources/js/report-print.ts'])
    </head>
    <body class="bg-muted/40 text-foreground">
        <div class="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-4 print:hidden">
            <a href="{{ $backUrl }}" class="rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm">
                Back to reports
            </a>
            <button type="button" data-print-report class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm">
                Print / Save as PDF
            </button>
        </div>

        <main class="sales-print-page mx-auto mb-8 max-w-[1480px] bg-background shadow-sm print:m-0 print:max-w-none print:shadow-none">
            <header class="bg-primary px-8 py-6 text-center text-primary-foreground">
                <h1 class="text-2xl font-semibold tracking-wide">{{ $title }}</h1>
                <p class="mt-1 text-sm opacity-90">{{ $scopeLabel }} · {{ $periodLabel }}</p>
            </header>

            <section class="grid grid-cols-2 gap-px border-x border-b bg-border md:grid-cols-4">
                <div class="bg-background px-5 py-4">
                    <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Net sales</p>
                    <p class="mt-1 text-lg font-semibold">₱{{ number_format($stats['total_sales'], 2) }}</p>
                </div>
                <div class="bg-background px-5 py-4">
                    <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Completed transactions</p>
                    <p class="mt-1 text-lg font-semibold">{{ number_format($stats['total_transactions']) }}</p>
                </div>
                <div class="bg-background px-5 py-4">
                    <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Returned</p>
                    <p class="mt-1 text-lg font-semibold">₱{{ number_format($stats['returned_amount'], 2) }}</p>
                </div>
                <div class="bg-background px-5 py-4">
                    <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Average sale</p>
                    <p class="mt-1 text-lg font-semibold">₱{{ number_format($stats['average_sale'], 2) }}</p>
                </div>
            </section>

            <div class="overflow-x-auto">
                <table class="w-full border-collapse text-[11px]">
                    <thead class="bg-primary text-primary-foreground">
                        <tr>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-left font-semibold">Invoice</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-left font-semibold">Date & Time</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-left font-semibold">Branch</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-left font-semibold">Customer</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-center font-semibold">Status</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-right font-semibold">Subtotal</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-right font-semibold">Discount</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-right font-semibold">Total</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-right font-semibold">Returned</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-right font-semibold">Net</th>
                            <th class="border border-primary-foreground/20 px-2 py-2 text-left font-semibold">Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($sales as $sale)
                            <tr class="even:bg-muted/50">
                                <td class="border px-2 py-2 font-medium">{{ $sale['invoice_number'] }}</td>
                                <td class="border px-2 py-2 whitespace-nowrap">
                                    {{ $sale['date'] }}<br>
                                    <span class="text-muted-foreground">{{ $sale['time'] }}</span>
                                </td>
                                <td class="border px-2 py-2">{{ $sale['branch_name'] }}</td>
                                <td class="border px-2 py-2">{{ $sale['customer_name'] }}</td>
                                <td @class([
                                    'border px-2 py-2 text-center font-semibold',
                                    'text-destructive' => $sale['status'] === 'Voided',
                                    'text-amber-700' => in_array($sale['status'], ['Fully Returned', 'Partial Return'], true),
                                ])>
                                    {{ $sale['status'] }}
                                </td>
                                <td class="border px-2 py-2 text-right">₱{{ number_format($sale['subtotal'], 2) }}</td>
                                <td class="border px-2 py-2 text-right">
                                    ₱{{ number_format($sale['discount_amount'], 2) }}
                                    <span class="text-muted-foreground">({{ number_format($sale['discount_percentage'], 2) }}%)</span>
                                </td>
                                <td class="border px-2 py-2 text-right">₱{{ number_format($sale['total'], 2) }}</td>
                                <td class="border px-2 py-2 text-right">₱{{ number_format($sale['returned'], 2) }}</td>
                                <td class="border px-2 py-2 text-right font-medium">₱{{ number_format($sale['net'], 2) }}</td>
                                <td class="border px-2 py-2">{{ $sale['payment_method'] }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="11" class="border px-4 py-10 text-center text-muted-foreground">
                                    No sales matched this report period.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                    <tfoot class="bg-primary font-semibold text-primary-foreground">
                        <tr>
                            <td colspan="5" class="border border-primary-foreground/20 px-3 py-3">
                                TOTAL ({{ number_format($stats['record_count']) }} records)
                            </td>
                            <td class="border border-primary-foreground/20 px-2 py-3 text-right">₱{{ number_format($stats['subtotal_amount'], 2) }}</td>
                            <td class="border border-primary-foreground/20 px-2 py-3 text-right">₱{{ number_format($stats['discount_amount'], 2) }}</td>
                            <td class="border border-primary-foreground/20 px-2 py-3 text-right">₱{{ number_format($stats['gross_sales'], 2) }}</td>
                            <td class="border border-primary-foreground/20 px-2 py-3 text-right">₱{{ number_format($stats['returned_amount'], 2) }}</td>
                            <td class="border border-primary-foreground/20 px-2 py-3 text-right">₱{{ number_format($stats['total_sales'], 2) }}</td>
                            <td class="border border-primary-foreground/20"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <footer class="flex justify-between gap-4 border-x border-b px-5 py-3 text-[10px] text-muted-foreground">
                <span>Pelaez Dermatology Clinic Management System</span>
                <span>Generated {{ $generatedAt }}</span>
            </footer>
        </main>
    </body>
</html>
