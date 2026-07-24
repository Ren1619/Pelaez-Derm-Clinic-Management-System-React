<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Rules\Unique;

abstract class BranchRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    protected function branchRules(Unique $branchNameRule): array
    {
        return [
            'branch_name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[\pL\pN\s-]+$/u',
                $branchNameRule,
            ],
            'branch_location' => [
                'required',
                'string',
                'max:255',
                "regex:/^[\\pL\\pN\\s.,\\-\\/#']+$/u",
            ],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'contact_number' => ['required', 'string', 'regex:/^09[0-9]{9}$/'],
            'map_link' => ['required', 'string', 'url:http,https'],
            'fb_link' => ['nullable', 'string', 'url:http,https'],
            'branch_img' => ['nullable', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(20 * 1024)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'branch_name.regex' => 'The branch name may only contain letters, numbers, spaces, and hyphens.',
            'branch_location.regex' => 'The branch location contains unsupported characters.',
            'contact_number.regex' => 'The contact number must start with 09 and contain exactly 11 digits.',
            'branch_img.mimes' => 'The branch image must be a JPEG, PNG, or WebP file.',
            'branch_img.max' => 'The branch image must not be larger than 20 MB.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'branch_name' => Str::of($this->input('branch_name', ''))->squish()->toString(),
            'branch_location' => Str::of($this->input('branch_location', ''))->squish()->toString(),
            'contact_number' => Str::of($this->input('contact_number', ''))->trim()->toString(),
            'map_link' => Str::of($this->input('map_link', ''))->trim()->toString(),
            'fb_link' => Str::of($this->input('fb_link', ''))->trim()->toString() ?: null,
        ]);
    }
}
