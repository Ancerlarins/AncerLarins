<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BlogPostCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Blog\CreateBlogPostRequest;
use App\Http\Requests\Blog\UpdateBlogPostRequest;
use App\Http\Resources\BlogPostListResource;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use App\Services\BlogService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Blog
 *
 * Blog posts and articles about real estate in Lagos.
 */
class BlogPostController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BlogService $blogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = BlogPost::published()->with('author')->latest('published_at');

        if ($request->filled('category')) {
            $category = BlogPostCategory::tryFrom($request->input('category'));
            if ($category) {
                $query->byCategory($category);
            }
        }

        if ($request->filled('tag')) {
            $tag = $request->input('tag');
            $query->whereJsonContains('tags', $tag);
        }

        if ($request->filled('q')) {
            $query->search($request->input('q'));
        }

        $posts = $query->paginate($request->perPage(12));

        return $this->paginatedResponse(
            $posts->through(fn ($post) => new BlogPostListResource($post)),
            'Blog posts retrieved.'
        );
    }

    public function show(string $slug): JsonResponse
    {
        $post = $this->blogService->getBySlug($slug);

        if (! $post) {
            return $this->errorResponse('Blog post not found.', 404);
        }

        return $this->successResponse(new BlogPostResource($post));
    }

    // ── Admin ─────────────────────────────────────────────

    /** @authenticated */
    public function store(CreateBlogPostRequest $request): JsonResponse
    {
        $post = $this->blogService->create($request->validated(), $request->user());

        return $this->successResponse(new BlogPostResource($post), 'Blog post created.', 201);
    }

    /** @authenticated */
    public function update(UpdateBlogPostRequest $request, BlogPost $blogPost): JsonResponse
    {
        $post = $this->blogService->update($blogPost, $request->validated());

        return $this->successResponse(new BlogPostResource($post), 'Blog post updated.');
    }

    /** @authenticated */
    public function destroy(Request $request, BlogPost $blogPost): JsonResponse
    {
        $this->blogService->delete($blogPost);

        return $this->successResponse(null, 'Blog post deleted.', 204);
    }
}
