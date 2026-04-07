<?php

namespace App\Services;

use App\Enums\WhatsAppSessionState;
use App\Models\Property;
use App\Models\WhatsAppConversation;
use Illuminate\Support\Facades\Log;

class WhatsAppBotService
{
    protected const PER_PAGE = 5;

    // Known Lagos area keywords for matching
    protected const AREA_KEYWORDS = [
        'lekki', 'ikoyi', 'victoria island', 'vi', 'ajah', 'yaba', 'ikeja',
        'surulere', 'gbagada', 'maryland', 'magodo', 'ogba', 'berger',
        'festac', 'amuwo', 'apapa', 'ibeju', 'epe', 'sangotedo',
        'osapa', 'chevron', 'jakande', 'oshodi', 'mushin', 'ketu',
    ];

    public function __construct(
        protected \App\Contracts\SmsService $smsService,
    ) {}

    /**
     * Main entry point: handle an incoming WhatsApp/SMS message.
     */
    public function handleIncoming(string $phone, string $message): void
    {
        $message = trim($message);
        $lower = strtolower($message);

        $conv = WhatsAppConversation::firstOrCreate(
            ['phone' => $phone],
            ['session_state' => WhatsAppSessionState::Idle, 'session_data' => []]
        );

        $conv->update(['last_message_at' => now()]);

        try {
            // Command routing
            if (in_array($lower, ['hi', 'hello', 'hey', 'start'])) {
                $this->sendWelcome($phone);
                $conv->update(['session_state' => WhatsAppSessionState::Idle, 'session_data' => []]);

                return;
            }

            if (in_array($lower, ['help', '?'])) {
                $this->sendHelp($phone);

                return;
            }

            if (in_array($lower, ['stop', 'reset', 'cancel'])) {
                $conv->update(['session_state' => WhatsAppSessionState::Idle, 'session_data' => []]);
                $this->sendMessage($phone, "Session reset. Send 'hi' to start again.");

                return;
            }

            // Searching: "search 2 bed lekki" or "find apartment yaba"
            if (preg_match('/^(search|find|looking for)\s+/i', $lower)) {
                $this->handleSearch($conv, $message);

                return;
            }

            // Pagination: "next" or "more"
            if (in_array($lower, ['next', 'more', 'n']) && $conv->session_state === WhatsAppSessionState::Browsing) {
                $this->handleBrowse($conv, ($conv->session_data['page'] ?? 1) + 1);

                return;
            }

            // Number selection: viewing from results
            if (is_numeric($lower) && $conv->session_state === WhatsAppSessionState::Browsing) {
                $this->handleView($conv, (int) $lower);

                return;
            }

            // Default: prompt with help
            $this->sendMessage($phone, "I didn't understand that. Try:\n- \"search 2 bed lekki\"\n- \"help\" for commands\n- \"hi\" to start over");

        } catch (\Exception $e) {
            Log::error('WhatsApp bot error', [
                'phone' => $phone,
                'message' => $message,
                'error' => $e->getMessage(),
            ]);
            $this->sendMessage($phone, 'Sorry, something went wrong. Please try again.');
        }
    }

    /**
     * Parse natural language search and query properties.
     */
    protected function handleSearch(WhatsAppConversation $conv, string $message): void
    {
        $lower = strtolower($message);

        // Remove search prefix
        $query = preg_replace('/^(search|find|looking for)\s+/i', '', $lower);

        // Extract bedrooms: "2 bed", "3 bedroom"
        $bedrooms = null;
        if (preg_match('/(\d+)\s*bed/', $query, $matches)) {
            $bedrooms = (int) $matches[1];
        }

        // Extract price: "under 2m", "below 500k"
        $maxPrice = null;
        if (preg_match('/(under|below|max|budget)\s*(\d+)(k|m)?/i', $query, $matches)) {
            $amount = (float) $matches[2];
            $multiplier = match (strtolower($matches[3] ?? '')) {
                'k' => 1000,
                'm' => 1000000,
                default => 1,
            };
            $maxPrice = (int) ($amount * $multiplier * 100); // kobo
        }

        // Extract area
        $areaName = null;
        foreach (self::AREA_KEYWORDS as $area) {
            if (str_contains($query, $area)) {
                $areaName = $area;
                break;
            }
        }

        // Build query
        $propertyQuery = Property::query()
            ->where('status', 'approved')
            ->with(['area', 'agent']);

        if ($bedrooms) {
            $propertyQuery->where('bedrooms', $bedrooms);
        }

        if ($maxPrice) {
            $propertyQuery->where('price_kobo', '<=', $maxPrice);
        }

        if ($areaName) {
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $areaName);
            $propertyQuery->whereHas('area', function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                    ->orWhere('slug', 'like', "%{$escaped}%");
            });
        }

        $results = $propertyQuery->latest()->limit(50)->get();

        if ($results->isEmpty()) {
            $this->sendMessage($conv->phone, "No properties found matching your search. Try different criteria.\n\nExamples:\n- \"search 3 bed lekki\"\n- \"search under 2m yaba\"");

            return;
        }

        // Store results in session
        $conv->update([
            'session_state' => WhatsAppSessionState::Browsing,
            'session_data' => [
                'property_ids' => $results->pluck('id')->toArray(),
                'page' => 1,
                'total' => $results->count(),
            ],
        ]);

        $this->handleBrowse($conv, 1);
    }

    /**
     * Show paginated results.
     */
    protected function handleBrowse(WhatsAppConversation $conv, int $page): void
    {
        $data = $conv->session_data;
        $ids = $data['property_ids'] ?? [];
        $total = count($ids);
        $offset = ($page - 1) * self::PER_PAGE;

        if ($offset >= $total) {
            $this->sendMessage($conv->phone, "No more results. Send 'search ...' for a new search.");

            return;
        }

        $pageIds = array_slice($ids, $offset, self::PER_PAGE);
        $properties = Property::whereIn('id', $pageIds)->with(['area', 'agent'])->get();

        $text = $this->formatPropertyList($properties, $offset);
        $text .= "\n\n📊 Showing ".($offset + 1).'-'.($offset + $properties->count())." of {$total}";

        if ($offset + self::PER_PAGE < $total) {
            $text .= "\n\nReply 'next' for more results.";
        }

        $text .= "\nReply with a number (e.g. '1') to see details.";

        $conv->update([
            'session_data' => array_merge($data, ['page' => $page]),
        ]);

        $this->sendMessage($conv->phone, $text);
    }

    /**
     * View a single property by its position number.
     */
    protected function handleView(WhatsAppConversation $conv, int $number): void
    {
        $data = $conv->session_data;
        $ids = $data['property_ids'] ?? [];
        $page = $data['page'] ?? 1;
        $offset = ($page - 1) * self::PER_PAGE;

        $index = $offset + $number - 1;

        if ($index < 0 || $index >= count($ids)) {
            $this->sendMessage($conv->phone, 'Invalid number. Pick a number from the list shown above.');

            return;
        }

        $property = Property::with(['area', 'agent.user'])->find($ids[$index]);

        if (! $property) {
            $this->sendMessage($conv->phone, 'Property not found. Try searching again.');

            return;
        }

        $text = $this->formatPropertyDetail($property);

        $conv->update(['session_state' => WhatsAppSessionState::Browsing]);

        $this->sendMessage($conv->phone, $text);
    }

    /**
     * Format a numbered list of properties.
     */
    protected function formatPropertyList($properties, int $offset): string
    {
        $lines = ["🏠 *Property Results*\n"];

        foreach ($properties as $i => $property) {
            $num = $offset + $i + 1;
            $price = $this->formatPrice($property->price_kobo);
            $area = $property->area?->name ?? '';
            $beds = $property->bedrooms ? "{$property->bedrooms}bed" : '';
            $type = $property->listing_type?->value ?? '';

            $lines[] = "*{$num}.* {$property->title}";
            $lines[] = "   💰 {$price} | 📍 {$area} | 🛏 {$beds} | {$type}";
            $lines[] = '';
        }

        return implode("\n", $lines);
    }

    /**
     * Format full property detail.
     */
    protected function formatPropertyDetail($property): string
    {
        $price = $this->formatPrice($property->price_kobo);
        $area = $property->area?->name ?? 'N/A';

        $lines = [
            "🏠 *{$property->title}*\n",
            "💰 *Price:* {$price}",
            "📍 *Location:* {$area}",
            '🏷 *Type:* '.ucfirst($property->listing_type?->value ?? 'N/A'),
        ];

        if ($property->bedrooms) {
            $lines[] = "🛏 *Bedrooms:* {$property->bedrooms}";
        }
        if ($property->bathrooms) {
            $lines[] = "🚿 *Bathrooms:* {$property->bathrooms}";
        }
        if ($property->floor_area_sqm) {
            $lines[] = "📐 *Area:* {$property->floor_area_sqm} sqm";
        }

        if ($property->description) {
            $desc = mb_substr(strip_tags($property->description), 0, 200);
            $lines[] = "\n📝 {$desc}...";
        }

        $lines[] = "\n🔗 *View online:* https://ancerlarins.com/properties/{$property->slug}";

        if ($property->agent?->user?->phone) {
            $agentPhone = preg_replace('/[^0-9]/', '', $property->agent->user->phone);
            $lines[] = "\n📱 *Contact Agent:* wa.me/{$agentPhone}";
            if ($property->agent->company_name) {
                $lines[] = "🏢 *Agent:* {$property->agent->company_name}";
            }
        }

        $lines[] = "\n---\nReply 'next' to continue browsing.";

        return implode("\n", $lines);
    }

    protected function sendWelcome(string $phone): void
    {
        $text = "👋 *Welcome to AncerLarins!*\n\n"
            ."I can help you find properties in Lagos.\n\n"
            ."Try these commands:\n"
            ."🔍 *search 2 bed lekki* — Find properties\n"
            ."🔍 *search under 2m yaba* — Budget search\n"
            ."❓ *help* — See all commands\n\n"
            .'What are you looking for?';

        $this->sendMessage($phone, $text);
    }

    protected function sendHelp(string $phone): void
    {
        $text = "📋 *AncerLarins Bot Commands*\n\n"
            ."🔍 *search [query]* — Search properties\n"
            ."   Examples:\n"
            ."   - search 3 bed lekki\n"
            ."   - search under 1m ajah\n"
            ."   - search apartment ikoyi\n\n"
            ."📄 *next* — See more results\n"
            ."🔢 *[number]* — View property details\n"
            ."🔄 *reset* — Start over\n"
            .'❓ *help* — Show this message';

        $this->sendMessage($phone, $text);
    }

    /**
     * Send an SMS via the configured SMS provider.
     */
    protected function sendMessage(string $phone, string $text): void
    {
        $this->smsService->sendSms($phone, $text);
    }

    protected function formatPrice(?int $kobo): string
    {
        if (! $kobo) {
            return 'N/A';
        }
        $naira = $kobo / 100;
        if ($naira >= 1_000_000) {
            return '₦'.number_format($naira / 1_000_000, 1).'M';
        }
        if ($naira >= 1_000) {
            return '₦'.number_format($naira / 1_000, 0).'K';
        }

        return '₦'.number_format($naira, 0);
    }
}
