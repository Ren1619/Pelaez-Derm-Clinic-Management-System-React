<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->dropAuditForeignKeys();
        $this->remapAuditIdentifiers('users', 'id', 'staff_accounts', 'account_ID');

        Schema::table('appointments', function (Blueprint $table): void {
            $table->foreign('created_by')->references('account_ID')->on('staff_accounts')->nullOnDelete();
        });
        Schema::table('sales', function (Blueprint $table): void {
            $table->foreign('processed_by')->references('account_ID')->on('staff_accounts')->nullOnDelete();
            $table->foreign('voided_by')->references('account_ID')->on('staff_accounts')->nullOnDelete();
        });
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->foreign('processed_by')->references('account_ID')->on('staff_accounts')->nullOnDelete();
        });
        Schema::table('expenses', function (Blueprint $table): void {
            $table->foreign('account_ID')->references('account_ID')->on('staff_accounts')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropAuditForeignKeys();
        $this->remapAuditIdentifiers('staff_accounts', 'account_ID', 'users', 'id');

        Schema::table('appointments', function (Blueprint $table): void {
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
        Schema::table('sales', function (Blueprint $table): void {
            $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('voided_by')->references('id')->on('users')->nullOnDelete();
        });
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
        });
        Schema::table('expenses', function (Blueprint $table): void {
            $table->foreign('account_ID')->references('id')->on('users')->nullOnDelete();
        });
    }

    private function dropAuditForeignKeys(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->dropForeign(['created_by']);
        });
        Schema::table('sales', function (Blueprint $table): void {
            $table->dropForeign(['processed_by']);
            $table->dropForeign(['voided_by']);
        });
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->dropForeign(['processed_by']);
        });
        Schema::table('expenses', function (Blueprint $table): void {
            $table->dropForeign(['account_ID']);
        });
    }

    private function remapAuditIdentifiers(
        string $sourceTable,
        string $sourceKey,
        string $targetTable,
        string $targetKey,
    ): void {
        $identifierMap = DB::table($sourceTable)
            ->join($targetTable, "{$targetTable}.email", '=', "{$sourceTable}.email")
            ->pluck("{$targetTable}.{$targetKey}", "{$sourceTable}.{$sourceKey}");

        foreach ($this->auditColumns() as $tableName => $columns) {
            foreach ($columns as $column) {
                $identifierMap->each(function (int $targetIdentifier, int $sourceIdentifier) use ($tableName, $column): void {
                    DB::table($tableName)
                        ->where($column, $sourceIdentifier)
                        ->update([$column => -$targetIdentifier]);
                });

                DB::table($tableName)->where($column, '>', 0)->update([$column => null]);

                $identifierMap->each(function (int $targetIdentifier) use ($tableName, $column): void {
                    DB::table($tableName)
                        ->where($column, -$targetIdentifier)
                        ->update([$column => $targetIdentifier]);
                });
            }
        }
    }

    /** @return array<string, list<string>> */
    private function auditColumns(): array
    {
        return [
            'appointments' => ['created_by'],
            'sales' => ['processed_by', 'voided_by'],
            'sale_returns' => ['processed_by'],
            'expenses' => ['account_ID'],
        ];
    }
};
