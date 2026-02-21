<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeltaSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── State ────────────────────────────────────────────
        $deltaId = Str::uuid()->toString();
        DB::table('states')->insert([
            'id' => $deltaId,
            'name' => 'Delta',
            'slug' => 'delta',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── Cities (Delta LGAs) ─────────────────────────────
        $lgas = [
            'Warri South', 'Oshimili South', 'Ughelli North',
        ];

        $cityIds = [];
        foreach ($lgas as $lga) {
            $id = Str::uuid()->toString();
            $cityIds[$lga] = $id;
            DB::table('cities')->insert([
                'id' => $id,
                'state_id' => $deltaId,
                'name' => $lga,
                'slug' => Str::slug($lga),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── Areas (~8 across Delta) ────────────────────────
        $areas = [
            // Warri South (4 areas)
            ['city' => 'Warri South', 'name' => 'Warri GRA', 'lat' => 5.5300, 'lng' => 5.7500, 'rent_1br' => 30000000, 'rent_2br' => 50000000, 'rent_3br' => 80000000, 'buy_sqm' => 12000000, 'safety' => 6.5],
            ['city' => 'Warri South', 'name' => 'Effurun', 'lat' => 5.5600, 'lng' => 5.7800, 'rent_1br' => 20000000, 'rent_2br' => 35000000, 'rent_3br' => 55000000, 'buy_sqm' => 8000000, 'safety' => 6.0],
            ['city' => 'Warri South', 'name' => 'Enerhen', 'lat' => 5.5500, 'lng' => 5.7700, 'rent_1br' => 15000000, 'rent_2br' => 25000000, 'rent_3br' => 40000000, 'buy_sqm' => 6000000, 'safety' => 5.5],
            ['city' => 'Warri South', 'name' => 'Jakpa', 'lat' => 5.5200, 'lng' => 5.7400, 'rent_1br' => 12000000, 'rent_2br' => 20000000, 'rent_3br' => 35000000, 'buy_sqm' => 5000000, 'safety' => 5.5],

            // Oshimili South (3 areas)
            ['city' => 'Oshimili South', 'name' => 'Asaba GRA', 'lat' => 6.2000, 'lng' => 6.7300, 'rent_1br' => 25000000, 'rent_2br' => 40000000, 'rent_3br' => 70000000, 'buy_sqm' => 10000000, 'safety' => 7.0],
            ['city' => 'Oshimili South', 'name' => 'Okpanam', 'lat' => 6.2200, 'lng' => 6.7100, 'rent_1br' => 15000000, 'rent_2br' => 25000000, 'rent_3br' => 40000000, 'buy_sqm' => 5000000, 'safety' => 6.0],
            ['city' => 'Oshimili South', 'name' => 'Cable Point', 'lat' => 6.1900, 'lng' => 6.7400, 'rent_1br' => 20000000, 'rent_2br' => 35000000, 'rent_3br' => 55000000, 'buy_sqm' => 8000000, 'safety' => 6.5],

            // Ughelli North (1 area)
            ['city' => 'Ughelli North', 'name' => 'Ughelli', 'lat' => 5.5000, 'lng' => 5.9900, 'rent_1br' => 10000000, 'rent_2br' => 18000000, 'rent_3br' => 30000000, 'buy_sqm' => 3000000, 'safety' => 5.5],
        ];

        $areaIds = [];
        foreach ($areas as $area) {
            $areaId = Str::uuid()->toString();
            $areaIds[$area['name']] = $areaId;
            DB::table('areas')->insert([
                'id' => $areaId,
                'city_id' => $cityIds[$area['city']],
                'name' => $area['name'],
                'slug' => Str::slug($area['name']),
                'avg_rent_1br' => $area['rent_1br'],
                'avg_rent_2br' => $area['rent_2br'],
                'avg_rent_3br' => $area['rent_3br'],
                'avg_buy_price_sqm' => $area['buy_sqm'],
                'safety_score' => $area['safety'],
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if (isset($area['lat']) && isset($area['lng'])) {
                DB::statement(
                    "UPDATE areas SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ?",
                    [$area['lng'], $area['lat'], $areaId]
                );
            }
        }

        // ── Landmarks (~4 across Delta) ──────────────────
        $this->seedLandmarks($areaIds, $now);
    }

    private function seedLandmarks(array $areaIds, $now): void
    {
        $landmarks = [
            ['area' => 'Asaba GRA', 'name' => 'Delta State Government House', 'type' => 'government', 'lat' => 6.1950, 'lng' => 6.7350],
            ['area' => 'Effurun', 'name' => 'Delta Mall Warri', 'type' => 'mall', 'lat' => 5.5550, 'lng' => 5.7750],
            ['area' => 'Effurun', 'name' => 'Federal University of Petroleum', 'type' => 'university', 'lat' => 5.5620, 'lng' => 5.7900],
            ['area' => 'Warri GRA', 'name' => 'Warri City Stadium', 'type' => 'recreation', 'lat' => 5.5250, 'lng' => 5.7450],
        ];

        foreach ($landmarks as $lm) {
            $areaId = $areaIds[$lm['area']] ?? null;
            if (! $areaId) {
                continue;
            }

            $id = Str::uuid()->toString();
            DB::table('landmarks')->insert([
                'id'         => $id,
                'area_id'    => $areaId,
                'name'       => $lm['name'],
                'type'       => $lm['type'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::statement(
                'UPDATE landmarks SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ?',
                [$lm['lng'], $lm['lat'], $id]
            );
        }
    }
}
