<?php

namespace App\Services;

use App\Models\Branch;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class BranchService
{
    /** @param array<string, mixed> $attributes */
    public function create(array $attributes, ?UploadedFile $image): Branch
    {
        $imagePath = $this->storeImage($image);

        try {
            return Branch::create([
                ...$attributes,
                'branch_img' => $imagePath,
            ]);
        } catch (Throwable $exception) {
            $this->deleteImage($imagePath);

            throw $exception;
        }
    }

    /** @param array<string, mixed> $attributes */
    public function update(Branch $branch, array $attributes, ?UploadedFile $image): Branch
    {
        $newImagePath = $this->storeImage($image);
        $oldImagePath = $branch->branch_img;

        try {
            $branch->update([
                ...$attributes,
                ...($newImagePath !== null ? ['branch_img' => $newImagePath] : []),
            ]);
        } catch (Throwable $exception) {
            $this->deleteImage($newImagePath);

            throw $exception;
        }

        if ($newImagePath !== null) {
            $this->deleteImage($oldImagePath);
        }

        return $branch->refresh();
    }

    public function delete(Branch $branch): void
    {
        $imagePath = $branch->branch_img;

        $branch->delete();

        $this->deleteImage($imagePath);
    }

    private function storeImage(?UploadedFile $image): ?string
    {
        if ($image === null) {
            return null;
        }

        $imagePath = $image->store('branches', 'public');

        if ($imagePath === false) {
            throw new RuntimeException('The branch image could not be stored.');
        }

        return $imagePath;
    }

    private function deleteImage(?string $imagePath): void
    {
        if ($imagePath !== null) {
            Storage::disk('public')->delete($imagePath);
        }
    }
}
