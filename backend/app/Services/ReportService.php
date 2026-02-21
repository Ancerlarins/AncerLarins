<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Enums\ReportStatus;
use App\Models\Property;
use App\Models\Report;
use App\Models\User;

class ReportService
{
    public function create(User $user, array $data): Report
    {
        $typeMap = [
            'property' => \App\Models\Property::class,
            'agent'    => \App\Models\AgentProfile::class,
            'review'   => \App\Models\AgentReview::class,
        ];

        $report = Report::create([
            'reporter_id'     => $user->id,
            'reportable_type' => $typeMap[$data['reportable_type']],
            'reportable_id'   => $data['reportable_id'],
            'reason'          => $data['reason'],
            'description'     => $data['description'] ?? null,
            'evidence_urls'   => $data['evidence_urls'] ?? null,
            'status'          => ReportStatus::Open,
        ]);

        $this->checkAutoArchive($data['reportable_type'], $data['reportable_id']);

        return $report;
    }

    public function resolve(Report $report, User $admin, ?string $note = null): void
    {
        $report->resolve($admin->id, $note);
    }

    public function dismiss(Report $report, User $admin, ?string $note = null): void
    {
        $report->update([
            'status'          => ReportStatus::Dismissed,
            'resolved_by'     => $admin->id,
            'resolution_note' => $note,
            'resolved_at'     => now(),
        ]);
    }

    protected function checkAutoArchive(string $type, string $id): void
    {
        if ($type !== 'property') {
            return;
        }

        $reportCount = Report::where('reportable_type', Property::class)
            ->where('reportable_id', $id)
            ->where('status', '!=', ReportStatus::Dismissed)
            ->count();

        if ($reportCount >= 3) {
            Property::where('id', $id)->update([
                'status' => PropertyStatus::Archived,
            ]);
        }
    }
}
