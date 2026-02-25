<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Reads the access_token from an httpOnly cookie and sets it as a
 * Bearer token on the request so Sanctum can authenticate normally.
 */
class ExtractTokenFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->bearerToken() && $request->cookie('access_token')) {
            $request->headers->set('Authorization', 'Bearer ' . $request->cookie('access_token'));
        }

        return $next($request);
    }
}
