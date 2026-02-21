<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnuguSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── State ────────────────────────────────────────────
        $enuguId = Str::uuid()->toString();
        DB::table('states')->insert([
            'id' => $enuguId,
            'name' => 'Enugu',
            'slug' => 'enugu',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── Cities (Enugu LGAs) ─────────────────────────────
        $lgas = [
            'Enugu North', 'Enugu South',
        ];

        $cityIds = [];
        foreach ($lgas as $lga) {
            $id = Str::uuid()->toString();
            $cityIds[$lga] = $id;
            DB::table('cities')->insert([
                'id' => $id,
                'state_id' => $enuguId,
                'name' => $lga,
                'slug' => Str::slug($lga),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── Areas (8 across Enugu) ────────────────────────
        $areas = [
            // Enugu North (4 areas)
            ['city' => 'Enugu North', 'name' => 'Independence Layout', 'lat' => 6.4600, 'lng' => 7.5100, 'rent_1br' => 30000000, 'rent_2br' => 50000000, 'rent_3br' => 80000000, 'buy_sqm' => 12000000, 'safety' => 7.5],
            ['city' => 'Enugu North', 'name' => 'New Haven', 'lat' => 6.4500, 'lng' => 7.5050, 'rent_1br' => 25000000, 'rent_2br' => 40000000, 'rent_3br' => 65000000, 'buy_sqm' => 10000000, 'safety' => 7.0],
            ['city' => 'Enugu North', 'name' => 'GRA Enugu', 'lat' => 6.4550, 'lng' => 7.5200, 'rent_1br' => 35000000, 'rent_2br' => 60000000, 'rent_3br' => 100000000, 'buy_sqm' => 15000000, 'safety' => 8.0],
            ['city' => 'Enugu North', 'name' => 'Ogui', 'lat' => 6.4400, 'lng' => 7.4950, 'rent_1br' => 15000000, 'rent_2br' => 25000000, 'rent_3br' => 40000000, 'buy_sqm' => 6000000, 'safety' => 6.0],

            // Enugu South (4 areas)
            ['city' => 'Enugu South', 'name' => 'Trans-Ekulu', 'lat' => 6.4350, 'lng' => 7.5300, 'rent_1br' => 20000000, 'rent_2br' => 35000000, 'rent_3br' => 55000000, 'buy_sqm' => 8000000, 'safety' => 6.5],
            ['city' => 'Enugu South', 'name' => 'Abakpa Nike', 'lat' => 6.4700, 'lng' => 7.5400, 'rent_1br' => 10000000, 'rent_2br' => 18000000, 'rent_3br' => 30000000, 'buy_sqm' => 4000000, 'safety' => 5.5],
            ['city' => 'Enugu South', 'name' => 'Emene', 'lat' => 6.4800, 'lng' => 7.5600, 'rent_1br' => 10000000, 'rent_2br' => 18000000, 'rent_3br' => 28000000, 'buy_sqm' => 3500000, 'safety' => 5.5],
            ['city' => 'Enugu South', 'name' => 'Coal Camp', 'lat' => 6.4300, 'lng' => 7.4900, 'rent_1br' => 12000000, 'rent_2br' => 20000000, 'rent_3br' => 35000000, 'buy_sqm' => 5000000, 'safety' => 5.5],
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

        // ── Landmarks (4 across Enugu) ──────────────────
        $this->seedLandmarks($areaIds, $now);
    }

    private function seedLandmarks(array $areaIds, $now): void
    {
        $landmarks = [
            ['area' => 'Independence Layout', 'name' => 'University of Nigeria Enugu Campus', 'type' => 'university', 'lat' => 6.4580, 'lng' => 7.5150],
            ['area' => 'GRA Enugu', 'name' => 'Enugu State Government House', 'type' => 'government', 'lat' => 6.4520, 'lng' => 7.5180],
            ['area' => 'Independence Layout', 'name' => 'Polo Park Mall', 'type' => 'mall', 'lat' => 6.4620, 'lng' => 7.5080],
            ['area' => 'Ogui', 'name' => 'Enugu Rangers Stadium', 'type' => 'recreation', 'lat' => 6.4430, 'lng' => 7.4980],
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
