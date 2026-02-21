<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AgentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BlogPostController;
use App\Http\Controllers\Api\V1\CooperativeController;
use App\Http\Controllers\Api\V1\EstateController;
use App\Http\Controllers\Api\V1\LandmarkController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\PropertyController;
use App\Http\Controllers\Api\V1\PropertyRequestController;
use App\Http\Controllers\Api\V1\ScrapedListingController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\SubscriptionController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AncerLarins API Routes (v1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Public: Auth ────────────────────────────────────
    Route::prefix('auth')->middleware('throttle:30,1')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    // ── Public: Properties ──────────────────────────────
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::get('/properties/{slug}', [PropertyController::class, 'show'])->where('slug', '[a-z0-9\-]+');
    Route::get('/properties/{property}/similar', [PropertyController::class, 'similar']);

    // ── Public: Search ──────────────────────────────────
    Route::get('/search', [SearchController::class, 'index']);
    Route::get('/search/suggestions', [SearchController::class, 'suggestions']);
    Route::get('/search/map', [SearchController::class, 'map']);

    // ── Public: Agents ──────────────────────────────────
    Route::get('/agents', [AgentController::class, 'index']);
    Route::get('/agents/{agent}', [AgentController::class, 'show']);
    Route::get('/agents/{agent}/listings', [AgentController::class, 'listings']);
    Route::get('/agents/{agent}/reviews', [AgentController::class, 'reviews']);

    // ── Webhooks (no auth, verified by signature) ──────
    Route::prefix('webhooks')->group(function () {
        Route::post('/paystack', [App\Http\Controllers\Api\V1\WebhookController::class, 'paystack']);
        Route::post('/termii', [App\Http\Controllers\Api\V1\WebhookController::class, 'termii']);
    });

    // ── Public: Locations ───────────────────────────────
    Route::get('/states', [LocationController::class, 'states']);
    Route::get('/cities', [LocationController::class, 'cities']);
    Route::get('/areas', [LocationController::class, 'areas']);
    Route::get('/areas/{area}', [LocationController::class, 'areaDetail']);
    Route::get('/areas/{area}/insights', [LocationController::class, 'areaInsights']);
    Route::get('/areas/{area}/trends', [LocationController::class, 'areaTrends']);

    // Location aliases for frontend compatibility
    Route::get('/locations/states', [LocationController::class, 'states']);
    Route::get('/locations/states/{state}/cities', [LocationController::class, 'citiesByState']);
    Route::get('/locations/cities/{city}/areas', [LocationController::class, 'areasByCity']);

    // Property types
    Route::get('/property-types', [LocationController::class, 'propertyTypes']);

    // ── Public: Landmarks ─────────────────────────────────
    Route::get('/landmarks', [LandmarkController::class, 'index']);
    Route::get('/landmarks/nearby', [LandmarkController::class, 'nearby']);

    // ── Public: Blog ────────────────────────────────────────
    Route::get('/blog-posts', [BlogPostController::class, 'index']);
    Route::get('/blog-posts/{slug}', [BlogPostController::class, 'show'])->where('slug', '[a-z0-9\-]+');

    // ── Public: Estates ─────────────────────────────────────
    Route::get('/estates', [EstateController::class, 'index']);
    Route::get('/estates/{slug}', [EstateController::class, 'show'])->where('slug', '[a-z0-9\-]+');

    // ── Public: Property Requests (browse for agents) ────
    Route::get('/property-requests', [PropertyRequestController::class, 'index']);
    Route::get('/property-requests/{propertyRequest}', [PropertyRequestController::class, 'show']);

    // ── Public: Subscription Plans ────────────────────────
    Route::get('/subscription/plans', [SubscriptionController::class, 'plans']);

    // ── Protected: Authenticated users ──────────────────
    Route::middleware(['auth:sanctum', 'throttle:60,1', 'ensure.phone_verified', 'track.activity'])->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // User profile & preferences
        Route::get('/me', [UserController::class, 'me']);
        Route::put('/me', [UserController::class, 'update']);

        // Saved properties
        Route::get('/me/saved-properties', [UserController::class, 'savedProperties']);
        Route::post('/properties/{property}/save', [PropertyController::class, 'save']);

        // Saved searches
        Route::get('/me/saved-searches', [UserController::class, 'savedSearches']);
        Route::post('/me/saved-searches', [UserController::class, 'createSavedSearch']);
        Route::delete('/me/saved-searches/{savedSearch}', [UserController::class, 'deleteSavedSearch']);

        // Notifications
        Route::get('/me/notifications', [UserController::class, 'notifications']);
        Route::get('/me/notifications/unread-count', [UserController::class, 'unreadNotificationsCount']);
        Route::patch('/me/notifications/{notification}/read', [UserController::class, 'markNotificationRead']);
        Route::post('/me/notifications/read-all', [UserController::class, 'markAllNotificationsRead']);

        // Push tokens
        Route::post('/me/push-tokens', [UserController::class, 'registerPushToken']);
        Route::delete('/me/push-tokens', [UserController::class, 'removePushToken']);

        // Reviews
        Route::post('/agents/{agent}/reviews', [AgentController::class, 'createReview']);

        // Neighborhood reviews
        Route::post('/areas/{area}/reviews', [LocationController::class, 'submitAreaReview']);

        // Estate reviews
        Route::post('/estates/{estate}/reviews', [EstateController::class, 'createReview']);

        // Cooperatives
        Route::get('/cooperatives', [CooperativeController::class, 'index']);
        Route::get('/cooperatives/{cooperative}', [CooperativeController::class, 'show']);
        Route::post('/cooperatives', [CooperativeController::class, 'store']);
        Route::post('/cooperatives/{cooperative}/join', [CooperativeController::class, 'join']);
        Route::post('/cooperatives/{cooperative}/contribute', [CooperativeController::class, 'contribute']);
        Route::post('/cooperatives/verify-contribution', [CooperativeController::class, 'verifyContribution']);
        Route::get('/my-cooperatives', [CooperativeController::class, 'myCooperatives']);
        Route::get('/cooperatives/{cooperative}/progress', [CooperativeController::class, 'progress']);

        // Property requests
        Route::get('/my-requests', [PropertyRequestController::class, 'myRequests']);
        Route::post('/property-requests', [PropertyRequestController::class, 'store']);
        Route::delete('/property-requests/{propertyRequest}', [PropertyRequestController::class, 'destroy']);
        Route::post('/property-requests/{propertyRequest}/responses/{response}/accept', [PropertyRequestController::class, 'acceptResponse']);

        // Contact / leads (rate limited to prevent spam)
        Route::post('/properties/{property}/contact', [PropertyController::class, 'contact'])->middleware('throttle:10,1');

        // Reports
        Route::post('/reports', [PropertyController::class, 'report']);

        // ── Agent routes ────────────────────────────────
        Route::middleware('ensure.agent')->prefix('agent')->group(function () {

            Route::get('/dashboard', [AgentController::class, 'dashboard']);
            Route::get('/leads', [AgentController::class, 'leads']);
            Route::put('/leads/{lead}/respond', [AgentController::class, 'respondToLead']);
            Route::put('/profile', [AgentController::class, 'updateProfile']);
            Route::post('/verification', [AgentController::class, 'submitVerification']);
            Route::get('/verification/documents', [AgentController::class, 'verificationDocuments']);

            // Property management
            Route::post('/properties', [PropertyController::class, 'store']);
            Route::put('/properties/{property}', [PropertyController::class, 'update']);
            Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
            Route::post('/properties/{property}/images', [PropertyController::class, 'uploadImages']);
            Route::delete('/images/{image}', [PropertyController::class, 'removeImage']);

            // Property request responses
            Route::post('/property-requests/{propertyRequest}/respond', [PropertyRequestController::class, 'respond']);

            // Subscription management
            Route::post('/subscription/initialize', [SubscriptionController::class, 'initialize']);
            Route::post('/subscription/verify', [SubscriptionController::class, 'verify']);
            Route::get('/subscription/current', [SubscriptionController::class, 'current']);
        });

        // ── Admin routes ────────────────────────────────
        Route::middleware(['ensure.admin', 'throttle:120,1'])->prefix('admin')->group(function () {

            Route::get('/dashboard', [AdminController::class, 'dashboard']);

            // Property moderation
            Route::get('/properties/pending', [AdminController::class, 'pendingProperties']);
            Route::post('/properties/approve', [AdminController::class, 'approveProperty']);
            Route::post('/properties/reject', [AdminController::class, 'rejectProperty']);
            Route::post('/properties/feature', [AdminController::class, 'featureProperty']);

            // Agent moderation
            Route::get('/agents/pending', [AdminController::class, 'pendingAgents']);
            Route::get('/agents/{agent}/documents', [AdminController::class, 'agentDocuments']);
            Route::post('/agents/verify', [AdminController::class, 'verifyAgent']);
            Route::post('/agents/reject', [AdminController::class, 'rejectAgent']);

            // Users
            Route::post('/users/ban', [AdminController::class, 'banUser']);
            Route::post('/users/unban', [AdminController::class, 'unbanUser']);

            // Reports
            Route::get('/reports', [AdminController::class, 'reports']);
            Route::post('/reports/{report}/resolve', [AdminController::class, 'resolveReport']);
            Route::put('/reports/{report}/dismiss', [AdminController::class, 'dismissReport']);

            // Activity logs
            Route::get('/activity-logs', [AdminController::class, 'activityLogs']);

            // Scraped listings
            Route::get('/scraped-listings', [ScrapedListingController::class, 'index']);
            Route::post('/scraped-listings/{scrapedListing}/approve', [ScrapedListingController::class, 'approve']);
            Route::post('/scraped-listings/{scrapedListing}/reject', [ScrapedListingController::class, 'reject']);

            // Estate management
            Route::get('/estates', [EstateController::class, 'adminIndex']);
            Route::post('/estates', [EstateController::class, 'store']);
            Route::put('/estates/{estate}', [EstateController::class, 'update']);
            Route::delete('/estates/{estate}', [EstateController::class, 'destroy']);

            // Cooperative management
            Route::get('/cooperatives', [CooperativeController::class, 'adminIndex']);
            Route::get('/cooperatives/{cooperative}', [CooperativeController::class, 'adminShow']);
            Route::put('/cooperatives/{cooperative}/status', [CooperativeController::class, 'adminUpdateStatus']);
            Route::delete('/cooperatives/{cooperative}', [CooperativeController::class, 'adminDestroy']);

            // Property request management
            Route::get('/property-requests', [PropertyRequestController::class, 'adminIndex']);
            Route::get('/property-requests/{propertyRequest}', [PropertyRequestController::class, 'adminShow']);
            Route::put('/property-requests/{propertyRequest}/status', [PropertyRequestController::class, 'adminUpdateStatus']);
            Route::delete('/property-requests/{propertyRequest}', [PropertyRequestController::class, 'adminDestroy']);

            // Blog management
            Route::post('/blog-posts', [BlogPostController::class, 'store']);
            Route::put('/blog-posts/{blogPost}', [BlogPostController::class, 'update']);
            Route::delete('/blog-posts/{blogPost}', [BlogPostController::class, 'destroy']);
        });
    });
});
