<?php

namespace App\Models;

use App\Enums\ReportReason;
use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations;

class Report extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'reporter_id', 'reportable_type', 'reportable_id',
        'reason', 'description', 'evidence_urls',
        'status', 'resolved_by', 'resolution_note', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'reason'        => ReportReason::class,
            'status'        => ReportStatus::class,
            'evidence_urls' => 'array',
            'resolved_at'   => 'datetime',
            'created_at'    => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────────

    public function reporter(): Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reportable(): Relations\MorphTo
    {
        return $this->morphTo();
    }

    public function resolvedByUser(): Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    // ── Scopes ───────────────────────────────────────────

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', ReportStatus::Open);
    }

    public function scopeUnresolved(Builder $query): Builder
    {
        return $query->whereIn('status', [ReportStatus::Open, ReportStatus::Investigating]);
    }

    // ── Helpers ──────────────────────────────────────────

    public function resolve(string $userId, ?string $note = null): void
    {
        $this->update([
            'status'          => ReportStatus::Resolved,
            'resolved_by'     => $userId,
            'resolution_note' => $note,
            'resolved_at'     => now(),
        ]);
    }
}
