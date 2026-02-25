<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Replace dangerous cascadeOnDelete foreign keys with restrictOnDelete
 * or nullOnDelete to prevent accidental data loss.
 *
 * Junction/session tables (saved_properties, property_amenities, refresh_tokens,
 * notifications, push_tokens, saved_searches, property_views, cooperative_contributions)
 * keep cascade since the child records are meaningless without the parent.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Geographic data — restrict deletion of parent locations ──

        $this->swapForeignKey('cities', 'state_id', 'states', 'restrict');
        $this->swapForeignKey('areas', 'city_id', 'cities', 'restrict');
        $this->swapForeignKey('landmarks', 'area_id', 'areas', 'restrict');
        $this->swapForeignKey('estates', 'area_id', 'areas', 'restrict');
        $this->swapForeignKey('external_price_data', 'area_id', 'areas', 'restrict');
        $this->swapForeignKey('neighborhood_reviews', 'area_id', 'areas', 'restrict');

        // ── Agent / Profile — don't lose profiles or properties ──

        $this->swapForeignKey('agent_profiles', 'user_id', 'users', 'restrict');
        $this->swapForeignKey('properties', 'agent_id', 'agent_profiles', 'restrict');
        $this->swapForeignKey('agent_reviews', 'agent_id', 'agent_profiles', 'restrict');

        // ── Property children — don't lose data without cleanup ──

        $this->swapForeignKey('property_images', 'property_id', 'properties', 'restrict');
        $this->swapForeignKey('price_history', 'property_id', 'properties', 'restrict');
        $this->swapForeignKey('virtual_tours', 'property_id', 'properties', 'restrict');

        // ── Leads & financial records — never lose these silently ──

        $this->swapForeignKey('leads', 'property_id', 'properties', 'restrict');
        $this->swapForeignKey('documents', 'lead_id', 'leads', 'restrict');
        $this->swapForeignKey('commissions', 'lead_id', 'leads', 'restrict');
        $this->swapForeignKey('commissions', 'property_id', 'properties', 'restrict');

        // ── Cooperatives — can't delete admin or cooperative with members ──

        $this->swapForeignKey('cooperatives', 'admin_user_id', 'users', 'restrict');
        $this->swapForeignKey('cooperative_members', 'user_id', 'users', 'restrict');

        // ── Blog posts — don't lose posts when deleting author ──

        $this->swapForeignKey('blog_posts', 'author_id', 'users', 'restrict');

        // ── Estate reviews — don't lose reviews with estate ──

        $this->swapForeignKey('estate_reviews', 'estate_id', 'estates', 'restrict');

        // ── nullOnDelete: keep the record, just clear the FK ──

        $this->swapForeignKeyNullable('leads', 'agent_id', 'agent_profiles', 'nullOnDelete');
        $this->swapForeignKeyNullable('reports', 'reporter_id', 'users', 'nullOnDelete');
        $this->swapForeignKeyNullable('agent_reviews', 'user_id', 'users', 'nullOnDelete');
        $this->swapForeignKeyNullable('neighborhood_reviews', 'user_id', 'users', 'nullOnDelete');
        $this->swapForeignKeyNullable('estate_reviews', 'user_id', 'users', 'nullOnDelete');
        $this->swapForeignKeyNullable('mortgage_inquiries', 'user_id', 'users', 'nullOnDelete');
        $this->swapForeignKeyNullable('property_requests', 'user_id', 'users', 'nullOnDelete');
        $this->swapForeignKeyNullable('property_request_responses', 'agent_id', 'agent_profiles', 'nullOnDelete');
        $this->swapForeignKeyNullable('documents', 'uploaded_by', 'users', 'nullOnDelete');
        $this->swapForeignKeyNullable('commissions', 'created_by', 'users', 'nullOnDelete');
    }

    public function down(): void
    {
        // Revert all back to cascadeOnDelete

        $this->swapForeignKey('cities', 'state_id', 'states', 'cascade');
        $this->swapForeignKey('areas', 'city_id', 'cities', 'cascade');
        $this->swapForeignKey('landmarks', 'area_id', 'areas', 'cascade');
        $this->swapForeignKey('estates', 'area_id', 'areas', 'cascade');
        $this->swapForeignKey('external_price_data', 'area_id', 'areas', 'cascade');
        $this->swapForeignKey('neighborhood_reviews', 'area_id', 'areas', 'cascade');

        $this->swapForeignKey('agent_profiles', 'user_id', 'users', 'cascade');
        $this->swapForeignKey('properties', 'agent_id', 'agent_profiles', 'cascade');
        $this->swapForeignKey('agent_reviews', 'agent_id', 'agent_profiles', 'cascade');

        $this->swapForeignKey('property_images', 'property_id', 'properties', 'cascade');
        $this->swapForeignKey('price_history', 'property_id', 'properties', 'cascade');
        $this->swapForeignKey('virtual_tours', 'property_id', 'properties', 'cascade');

        $this->swapForeignKey('leads', 'property_id', 'properties', 'cascade');
        $this->swapForeignKey('documents', 'lead_id', 'leads', 'cascade');
        $this->swapForeignKey('commissions', 'lead_id', 'leads', 'cascade');
        $this->swapForeignKey('commissions', 'property_id', 'properties', 'cascade');

        $this->swapForeignKey('cooperatives', 'admin_user_id', 'users', 'cascade');
        $this->swapForeignKey('cooperative_members', 'user_id', 'users', 'cascade');

        $this->swapForeignKey('blog_posts', 'author_id', 'users', 'cascade');

        $this->swapForeignKey('estate_reviews', 'estate_id', 'estates', 'cascade');

        $this->swapForeignKey('leads', 'agent_id', 'agent_profiles', 'cascade');
        $this->swapForeignKey('reports', 'reporter_id', 'users', 'cascade');
        $this->swapForeignKey('agent_reviews', 'user_id', 'users', 'cascade');
        $this->swapForeignKey('neighborhood_reviews', 'user_id', 'users', 'cascade');
        $this->swapForeignKey('estate_reviews', 'user_id', 'users', 'cascade');
        $this->swapForeignKey('mortgage_inquiries', 'user_id', 'users', 'cascade');
        $this->swapForeignKey('property_requests', 'user_id', 'users', 'cascade');
        $this->swapForeignKey('property_request_responses', 'agent_id', 'agent_profiles', 'cascade');
        $this->swapForeignKey('documents', 'uploaded_by', 'users', 'cascade');
        $this->swapForeignKey('commissions', 'created_by', 'users', 'cascade');
    }

    /**
     * Drop and re-create a foreign key with the given delete behaviour.
     */
    private function swapForeignKey(string $table, string $column, string $referencedTable, string $onDelete): void
    {
        Schema::table($table, function (Blueprint $t) use ($column, $referencedTable, $onDelete) {
            $t->dropForeign([$column]);

            $fk = $t->foreign($column)->references('id')->on($referencedTable);

            match ($onDelete) {
                'restrict'     => $fk->restrictOnDelete(),
                'nullOnDelete' => $fk->nullOnDelete(),
                default        => $fk->cascadeOnDelete(),
            };
        });
    }

    /**
     * Drop FK, make column nullable (if not already), and re-create with nullOnDelete.
     */
    private function swapForeignKeyNullable(string $table, string $column, string $referencedTable, string $onDelete): void
    {
        Schema::table($table, function (Blueprint $t) use ($column) {
            $t->dropForeign([$column]);
        });

        // Ensure the column is nullable so SET NULL can work
        Schema::table($table, function (Blueprint $t) use ($column) {
            $t->uuid($column)->nullable()->change();
        });

        Schema::table($table, function (Blueprint $t) use ($column, $referencedTable) {
            $t->foreign($column)->references('id')->on($referencedTable)->nullOnDelete();
        });
    }
};
