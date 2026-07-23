<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Distribution;
use App\Models\Product;
use App\Models\StaffAccount;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DistributionSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $branches = Branch::query()->orderBy('branch_ID')->get();
        $creators = StaffAccount::query()
            ->whereHas('role', fn ($query) => $query->where('role_name', 'admin'))
            ->get()
            ->keyBy('branch_ID');
        $statuses = [Distribution::Pending, Distribution::InTransit, Distribution::Delivered, Distribution::Cancelled];

        if ($branches->count() < 2) {
            return;
        }

        foreach ($statuses as $statusIndex => $status) {
            foreach ($branches as $fromIndex => $fromBranch) {
                $toBranch = $branches[($fromIndex + 1) % $branches->count()];
                $scheduledDate = CarbonImmutable::now()
                    ->subMonthsNoOverflow($statusIndex * 2)
                    ->startOfMonth()
                    ->addDays(8 + $fromIndex);
                $distribution = Distribution::query()->updateOrCreate(
                    [
                        'from_branch_ID' => $fromBranch->branch_ID,
                        'to_branch_ID' => $toBranch->branch_ID,
                        'scheduled_date' => $scheduledDate,
                    ],
                    [
                        'created_by' => $creators->get($fromBranch->branch_ID)?->account_ID,
                        'status' => $status,
                        'sent_date' => in_array($status, [Distribution::InTransit, Distribution::Delivered], true)
                            ? $scheduledDate->addDay()
                            : null,
                        'received_date' => $status === Distribution::Delivered ? $scheduledDate->addDays(2) : null,
                        'notes' => 'Seeded stock transfer for distribution workflow testing.',
                        'cancellation_reason' => $status === Distribution::Cancelled
                            ? 'Transfer cancelled during demo workflow testing.'
                            : null,
                    ],
                );
                $distribution->forceFill([
                    'created_at' => $scheduledDate->subDay(),
                    'updated_at' => $scheduledDate,
                ])->saveQuietly();

                Product::query()->where('branch_ID', $fromBranch->branch_ID)->with('category')->take(2)->get()
                    ->each(function (Product $product, int $productIndex) use ($distribution, $scheduledDate): void {
                        $item = $distribution->items()->updateOrCreate(
                            ['product_ID' => $product->product_ID],
                            [
                                'category_ID' => $product->category_ID,
                                'product_name' => $product->name,
                                'category_name' => $product->category->category_name,
                                'measurement_unit' => $product->measurement_unit,
                                'quantity' => 3 + $productIndex,
                                'price' => $product->price,
                                'expiration_date' => $product->expiration_date,
                                'product_img' => $product->product_img,
                            ],
                        );
                        $item->forceFill(['created_at' => $scheduledDate, 'updated_at' => $scheduledDate])->saveQuietly();
                    });
            }
        }
    }
}
