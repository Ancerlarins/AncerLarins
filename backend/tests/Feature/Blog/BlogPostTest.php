<?php

namespace Tests\Feature\Blog;

use App\Enums\BlogPostCategory;
use App\Enums\BlogPostStatus;
use App\Models\BlogPost;
use App\Models\User;
use App\Services\BlogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlogPostTest extends TestCase
{
    use RefreshDatabase;

    // ── Public: Browse ───────────────────────────────────────

    public function test_list_published_posts(): void
    {
        $author = User::factory()->admin()->create();

        BlogPost::factory()->count(3)->published()->create(['author_id' => $author->id]);
        BlogPost::factory()->create(['author_id' => $author->id, 'status' => BlogPostStatus::Draft]);

        $response = $this->getJson('/api/v1/blog-posts');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_show_post_by_slug(): void
    {
        $author = User::factory()->admin()->create();
        $post = BlogPost::factory()->published()->create(['author_id' => $author->id]);

        $response = $this->getJson("/api/v1/blog-posts/{$post->slug}");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_show_returns_404_for_missing(): void
    {
        $response = $this->getJson('/api/v1/blog-posts/nonexistent-post-slug');

        $response->assertStatus(404);
    }

    // ── Admin: CRUD ──────────────────────────────────────────

    public function test_admin_can_create_post(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/blog-posts', [
            'title'    => 'Top 10 Lagos Neighborhoods for Investment',
            'content'  => 'Here are the best areas to invest in Lagos real estate...',
            'category' => BlogPostCategory::Guide->value,
            'status'   => BlogPostStatus::Published->value,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('blog_posts', [
            'title' => 'Top 10 Lagos Neighborhoods for Investment',
        ]);
    }

    public function test_admin_can_update_post(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);
        $post = BlogPost::factory()->published()->create(['author_id' => $admin->id]);

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/blog-posts/{$post->id}", [
            'title' => 'Updated Title for Blog Post',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals('Updated Title for Blog Post', $post->fresh()->title);
    }

    public function test_admin_can_delete_post(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);
        $post = BlogPost::factory()->published()->create(['author_id' => $admin->id]);

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/blog-posts/{$post->id}");

        $response->assertStatus(204);
        $this->assertSoftDeleted('blog_posts', ['id' => $post->id]);
    }
}
