<?php

namespace Database\Factories;

use App\Enums\BlogPostCategory;
use App\Enums\BlogPostStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<BlogPost> */
class BlogPostFactory extends Factory
{
    protected $model = BlogPost::class;

    public function definition(): array
    {
        $title = fake()->sentence(5);

        return [
            'author_id'  => User::factory(),
            'title'      => $title,
            'slug'       => Str::slug($title) . '-' . fake()->unique()->numberBetween(100, 99999),
            'excerpt'    => fake()->sentence(15),
            'content'    => fake()->paragraphs(3, true),
            'category'   => fake()->randomElement(BlogPostCategory::cases()),
            'tags'       => ['real-estate', 'nigeria'],
            'status'     => BlogPostStatus::Draft,
            'view_count' => 0,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status'       => BlogPostStatus::Published,
            'published_at' => now()->subDay(),
        ]);
    }
}
