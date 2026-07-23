<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class ServiceManagementService
{
    /** @return LengthAwarePaginator<int, Service> */
    public function paginate(string $search, int $perPage): LengthAwarePaginator
    {
        return Service::query()
            ->select([
                'service_ID',
                'category_ID',
                'name',
                'description',
                'service_img',
                'created_at',
            ])
            ->with([
                'category:category_ID,category_name,category_type,major_service_category_ID',
                'category.majorServiceCategory:major_service_category_ID,name',
            ])
            ->when($search, fn (Builder $query, string $searchTerm): Builder => $query->where(
                fn (Builder $serviceQuery): Builder => $serviceQuery
                    ->where('name', 'like', "%{$searchTerm}%")
                    ->orWhereHas('category', fn (Builder $categoryQuery): Builder => $categoryQuery
                        ->where('category_name', 'like', "%{$searchTerm}%")
                        ->orWhereHas('majorServiceCategory', fn (Builder $majorCategoryQuery): Builder => $majorCategoryQuery
                            ->where('name', 'like', "%{$searchTerm}%"))),
            ))
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes, ?UploadedFile $image): Service
    {
        $imagePath = $this->storeImage($image);

        try {
            return Service::create([
                ...$attributes,
                'service_img' => $imagePath,
            ]);
        } catch (Throwable $exception) {
            $this->deleteImage($imagePath);

            throw $exception;
        }
    }

    /** @param array<string, mixed> $attributes */
    public function update(Service $service, array $attributes, ?UploadedFile $image): Service
    {
        $newImagePath = $this->storeImage($image);
        $oldImagePath = $service->service_img;

        try {
            $service->update([
                ...$attributes,
                ...($newImagePath !== null ? ['service_img' => $newImagePath] : []),
            ]);
        } catch (Throwable $exception) {
            $this->deleteImage($newImagePath);

            throw $exception;
        }

        if ($newImagePath !== null) {
            $this->deleteImage($oldImagePath);
        }

        return $service->refresh();
    }

    public function delete(Service $service): void
    {
        $imagePath = $service->service_img;

        $service->delete();

        $this->deleteImage($imagePath);
    }

    private function storeImage(?UploadedFile $image): ?string
    {
        if ($image === null) {
            return null;
        }

        $imagePath = $image->store('services', 'public');

        if ($imagePath === false) {
            throw new RuntimeException('The service image could not be stored.');
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
