<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    protected $model = Document::class;

    /** Allowed document types matching the migration comment. */
    private const TYPES = [
        'buyer_agreement',
        'proof_of_funds',
        'id_verification',
        'offer_letter',
        'other',
    ];

    /** Common MIME types for property-related documents. */
    private const MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    public function definition(): array
    {
        $type = fake()->randomElement(self::TYPES);
        $fileName = fake()->slug(3).'.pdf';

        return [
            'lead_id' => Lead::factory(),
            'uploaded_by' => User::factory(),
            'type' => $type,
            'title' => ucwords(str_replace('_', ' ', $type)).' — '.fake()->date('Y-m-d'),
            'file_path' => 'documents/'.fake()->uuid().'/'.$fileName,
            'file_name' => $fileName,
            'mime_type' => fake()->randomElement(self::MIME_TYPES),
            'file_size' => fake()->numberBetween(50_000, 10_000_000), // 50 KB – 10 MB
            'notes' => fake()->optional(0.3)->sentence(8),
            'status' => 'pending',
        ];
    }

    /**
     * Set document type to buyer_agreement.
     */
    public function buyerAgreement(): static
    {
        return $this->state(fn () => [
            'type' => 'buyer_agreement',
            'title' => 'Buyer Agreement — '.fake()->date('Y-m-d'),
        ]);
    }

    /**
     * Mark the document as approved.
     */
    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => 'approved',
        ]);
    }

    /**
     * Mark the document as rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => 'rejected',
        ]);
    }
}
