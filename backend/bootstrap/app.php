<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureAgent;
use App\Http\Middleware\EnsurePhoneVerified;
use App\Http\Middleware\ExtractTokenFromCookie;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\TrackActivity;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Sentry\Laravel\Integration;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->prepend(ForceJsonResponse::class);
        $middleware->prepend(ExtractTokenFromCookie::class);
        $middleware->append(SetLocale::class);

        $middleware->alias([
            'ensure.phone_verified' => EnsurePhoneVerified::class,
            'ensure.agent'          => EnsureAgent::class,
            'ensure.admin'          => EnsureAdmin::class,
            'track.activity'        => TrackActivity::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        Integration::handles($exceptions);

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        });
    })->create();
