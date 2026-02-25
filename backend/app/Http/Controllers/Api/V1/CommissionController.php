<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\Lead;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    use ApiResponse;

    /**
     * List all commissions with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Commission::with([
            'lead:id,full_name,status',
            'property:id,title,slug',
            'creator:id,first_name,last_name',
        ]);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
        }

        $paginator = $query->orderByDesc('created_at')
            ->paginate($request->perPage(20));

        $items = collect($paginator->items())->map(fn (Commission $c) => $this->format($c));

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /**
     * Revenue summary stats.
     */
    public function summary(Request $request): JsonResponse
    {
        $year = $request->integer('year', now()->year);

        $totalEarned = Commission::where('status', 'paid')
            ->whereYear('paid_at', $year)
            ->sum('commission_amount_kobo');

        $totalPending = Commission::where('status', 'pending')
            ->sum('commission_amount_kobo');

        $totalInvoiced = Commission::where('status', 'invoiced')
            ->sum('commission_amount_kobo');

        $dealsWon = Lead::where('status', 'closed_won')
            ->whereYear('closed_at', $year)
            ->count();

        $dealsLost = Lead::where('status', 'closed_lost')
            ->whereYear('closed_at', $year)
            ->count();

        // Monthly revenue for the year
        $monthlyRevenue = Commission::where('status', 'paid')
            ->whereYear('paid_at', $year)
            ->selectRaw("EXTRACT(MONTH FROM paid_at) as month, SUM(commission_amount_kobo) as total")
            ->groupByRaw("EXTRACT(MONTH FROM paid_at)")
            ->orderByRaw("EXTRACT(MONTH FROM paid_at)")
            ->pluck('total', 'month')
            ->toArray();

        // Fill all 12 months
        $monthly = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthly[] = [
                'month' => $m,
                'total_kobo' => (int) ($monthlyRevenue[$m] ?? 0),
            ];
        }

        return $this->successResponse([
            'year'            => $year,
            'total_earned'    => $totalEarned,
            'total_pending'   => $totalPending,
            'total_invoiced'  => $totalInvoiced,
            'deals_won'       => $dealsWon,
            'deals_lost'      => $dealsLost,
            'monthly_revenue' => $monthly,
        ]);
    }

    /**
     * Create a commission record for a closed deal.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lead_id'          => ['required', 'uuid', 'exists:leads,id'],
            'sale_price_kobo'  => ['required', 'integer', 'min:1'],
            'commission_rate'  => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_method'   => ['nullable', 'in:bank_transfer,cash,cheque'],
            'notes'            => ['nullable', 'string', 'max:1000'],
        ]);

        $lead = Lead::with('property')->findOrFail($data['lead_id']);
        $rate = $data['commission_rate'] ?? 2.5;
        $amount = Commission::calculate($data['sale_price_kobo'], $rate);

        $commission = Commission::create([
            'lead_id'               => $lead->id,
            'property_id'           => $lead->property_id,
            'sale_price_kobo'       => $data['sale_price_kobo'],
            'commission_rate'       => $rate,
            'commission_amount_kobo' => $amount,
            'status'                => 'pending',
            'payment_method'        => $data['payment_method'] ?? null,
            'notes'                 => $data['notes'] ?? null,
            'created_by'            => $request->user()->id,
        ]);

        $commission->load(['lead:id,full_name', 'property:id,title,slug', 'creator:id,first_name,last_name']);

        return $this->successResponse(
            $this->format($commission),
            'Commission recorded.',
            201
        );
    }

    /**
     * Update commission status (invoiced, paid, cancelled).
     */
    public function updateStatus(Request $request, Commission $commission): JsonResponse
    {
        $data = $request->validate([
            'status'            => ['required', 'in:pending,invoiced,paid,cancelled'],
            'payment_reference' => ['nullable', 'string', 'max:200'],
            'notes'             => ['nullable', 'string', 'max:1000'],
        ]);

        $updates = ['status' => $data['status']];

        if ($data['status'] === 'paid' && !$commission->paid_at) {
            $updates['paid_at'] = now();
        }
        if (isset($data['payment_reference'])) {
            $updates['payment_reference'] = $data['payment_reference'];
        }
        if (isset($data['notes'])) {
            $updates['notes'] = $data['notes'];
        }

        $commission->update($updates);

        return $this->successResponse(null, 'Commission updated.');
    }

    /**
     * Calculate commission preview (no save).
     */
    public function calculate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sale_price_kobo' => ['required', 'integer', 'min:1'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $rate = $data['commission_rate'] ?? 2.5;
        $amount = Commission::calculate($data['sale_price_kobo'], $rate);

        return $this->successResponse([
            'sale_price_kobo'        => $data['sale_price_kobo'],
            'commission_rate'        => $rate,
            'commission_amount_kobo' => $amount,
            'formatted_sale_price'   => '₦' . number_format($data['sale_price_kobo'] / 100, 0, '.', ','),
            'formatted_commission'   => '₦' . number_format($amount / 100, 0, '.', ','),
        ]);
    }

    private function format(Commission $c): array
    {
        return [
            'id'                     => $c->id,
            'sale_price_kobo'        => $c->sale_price_kobo,
            'formatted_sale_price'   => $c->getFormattedSalePrice(),
            'commission_rate'        => $c->commission_rate,
            'commission_amount_kobo' => $c->commission_amount_kobo,
            'formatted_commission'   => $c->getFormattedCommission(),
            'status'                 => $c->status,
            'payment_method'         => $c->payment_method,
            'payment_reference'      => $c->payment_reference,
            'paid_at'                => $c->paid_at?->toIso8601String(),
            'notes'                  => $c->notes,
            'lead'    => $c->lead ? ['id' => $c->lead->id, 'full_name' => $c->lead->full_name, 'status' => $c->lead->status] : null,
            'property' => $c->property ? ['id' => $c->property->id, 'title' => $c->property->title, 'slug' => $c->property->slug] : null,
            'created_by' => $c->creator ? ['id' => $c->creator->id, 'full_name' => $c->creator->full_name] : null,
            'created_at' => $c->created_at?->toIso8601String(),
        ];
    }
}
