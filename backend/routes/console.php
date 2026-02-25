<?php

use Illuminate\Support\Facades\Schedule;

// Daily at 8am WAT: send daily digests for saved searches
Schedule::command('notifications:send-daily-digest')->dailyAt('08:00')->timezone('Africa/Lagos');

// Weekly on Monday at 8am WAT: send weekly digests
Schedule::command('notifications:send-weekly-digest')->weeklyOn(1, '08:00')->timezone('Africa/Lagos');

// Daily at midnight: expire old listings and warn about upcoming expirations
Schedule::command('properties:check-expiry')->daily();

// Hourly: recalculate agent performance metrics
Schedule::command('agents:update-performance')->hourly();

// Daily at 2am WAT: refresh property valuations (AncerEstimate)
Schedule::command('properties:refresh-valuations')->dailyAt('02:00')->timezone('Africa/Lagos');

// Daily at 3am WAT: recalculate area scores from neighborhood reviews
Schedule::command('areas:refresh-scores')->dailyAt('03:00')->timezone('Africa/Lagos');

// Daily at 3:30am WAT: expire old property requests
Schedule::command('property-requests:expire')->dailyAt('03:30')->timezone('Africa/Lagos');

// Daily at 12:30am WAT: prune old processed webhook records (older than 30 days)
Schedule::call(function () {
    \Illuminate\Support\Facades\DB::table('processed_webhooks')
        ->where('processed_at', '<', now()->subDays(30))
        ->delete();
})->dailyAt('00:30')->timezone('Africa/Lagos');

// Daily at 1am WAT: automated database backup (runs inside scheduler container)
Schedule::command('db:backup')->dailyAt('01:00')->timezone('Africa/Lagos')
    ->onOneServer()
    ->withoutOverlapping();

// Daily at 4am WAT: scrape property listings from external sources
Schedule::command('scraper:run propertypro --pages=20')->dailyAt('04:00')->timezone('Africa/Lagos');
Schedule::command('scraper:run nigeriapropertycentre --pages=20')->dailyAt('04:30')->timezone('Africa/Lagos');
Schedule::command('scraper:run jiji --pages=20')->dailyAt('05:00')->timezone('Africa/Lagos');
