<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RiversSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── State ────────────────────────────────────────────
        $riversId = Str::uuid()->toString();
        DB::table('states')->insert([
            'id' => $riversId,
            'name' => 'Rivers',
            'slug' => 'rivers',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── Cities (Rivers LGAs) ──────────────────────────
        $lgas = [
            'Port Harcourt', 'Obio-Akpor', 'Eleme',
        ];

        $cityIds = [];
        foreach ($lgas as $lga) {
            $id = Str::uuid()->toString();
            $cityIds[$lga] = $id;
            DB::table('cities')->insert([
                'id' => $id,
                'state_id' => $riversId,
                'name' => $lga,
                'slug' => Str::slug($lga),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── Areas (12 across Rivers) ──────────────────────
        $areas = [
            // Port Harcourt (7 areas)
            ['city' => 'Port Harcourt', 'name' => 'GRA Phase 1', 'lat' => 4.8050, 'lng' => 7.0150, 'rent_1br' => 100000000, 'rent_2br' => 180000000, 'rent_3br' => 300000000, 'buy_sqm' => 40000000, 'safety' => 8.0],
            ['city' => 'Port Harcourt', 'name' => 'GRA Phase 2', 'lat' => 4.8100, 'lng' => 7.0300, 'rent_1br' => 80000000, 'rent_2br' => 150000000, 'rent_3br' => 250000000, 'buy_sqm' => 35000000, 'safety' => 7.5],
            ['city' => 'Port Harcourt', 'name' => 'Old GRA', 'lat' => 4.7900, 'lng' => 7.0100, 'rent_1br' => 70000000, 'rent_2br' => 130000000, 'rent_3br' => 220000000, 'buy_sqm' => 30000000, 'safety' => 7.0],
            ['city' => 'Port Harcourt', 'name' => 'D-Line', 'lat' => 4.8000, 'lng' => 7.0050, 'rent_1br' => 50000000, 'rent_2br' => 80000000, 'rent_3br' => 130000000, 'buy_sqm' => 20000000, 'safety' => 6.5],
            ['city' => 'Port Harcourt', 'name' => 'Trans Amadi', 'lat' => 4.8150, 'lng' => 7.0450, 'rent_1br' => 40000000, 'rent_2br' => 70000000, 'rent_3br' => 120000000, 'buy_sqm' => 15000000, 'safety' => 6.0],
            ['city' => 'Port Harcourt', 'name' => 'Woji', 'lat' => 4.8200, 'lng' => 7.0600, 'rent_1br' => 40000000, 'rent_2br' => 70000000, 'rent_3br' => 110000000, 'buy_sqm' => 14000000, 'safety' => 6.0],
            ['city' => 'Port Harcourt', 'name' => 'Diobu', 'lat' => 4.7800, 'lng' => 7.0000, 'rent_1br' => 20000000, 'rent_2br' => 35000000, 'rent_3br' => 50000000, 'buy_sqm' => 8000000, 'safety' => 5.0],

            // Obio-Akpor (5 areas)
            ['city' => 'Obio-Akpor', 'name' => 'Rumuola', 'lat' => 4.8300, 'lng' => 6.9900, 'rent_1br' => 35000000, 'rent_2br' => 60000000, 'rent_3br' => 100000000, 'buy_sqm' => 12000000, 'safety' => 6.0],
            ['city' => 'Obio-Akpor', 'name' => 'Rukpokwu', 'lat' => 4.8700, 'lng' => 7.0200, 'rent_1br' => 25000000, 'rent_2br' => 40000000, 'rent_3br' => 70000000, 'buy_sqm' => 8000000, 'safety' => 5.5],
            ['city' => 'Obio-Akpor', 'name' => 'Choba', 'lat' => 4.8900, 'lng' => 6.9200, 'rent_1br' => 15000000, 'rent_2br' => 25000000, 'rent_3br' => 45000000, 'buy_sqm' => 5000000, 'safety' => 5.5],
            ['city' => 'Obio-Akpor', 'name' => 'Eliozu', 'lat' => 4.8600, 'lng' => 7.0400, 'rent_1br' => 25000000, 'rent_2br' => 40000000, 'rent_3br' => 65000000, 'buy_sqm' => 8000000, 'safety' => 5.5],
            ['city' => 'Obio-Akpor', 'name' => 'Peter Odili Road', 'lat' => 4.8250, 'lng' => 7.0500, 'rent_1br' => 60000000, 'rent_2br' => 100000000, 'rent_3br' => 180000000, 'buy_sqm' => 25000000, 'safety' => 7.0],
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

        // ── Landmarks (6 across Rivers) ──────────────────
        $this->seedLandmarks($areaIds, $now);
    }

    private function seedLandmarks(array $areaIds, $now): void
    {
        $landmarks = [
            ['area' => 'Eliozu', 'name' => 'Port Harcourt International Airport', 'type' => 'airport', 'lat' => 5.0155, 'lng' => 6.9496],
            ['area' => 'Choba', 'name' => 'University of Port Harcourt', 'type' => 'university', 'lat' => 4.9010, 'lng' => 6.9150],
            ['area' => 'D-Line', 'name' => 'Rivers State University', 'type' => 'university', 'lat' => 4.8020, 'lng' => 7.0020],
            ['area' => 'Old GRA', 'name' => 'Rivers State Government House', 'type' => 'government', 'lat' => 4.7850, 'lng' => 7.0050],
            ['area' => 'GRA Phase 1', 'name' => 'Port Harcourt Pleasure Park', 'type' => 'recreation', 'lat' => 4.8000, 'lng' => 7.0200],
            ['area' => 'GRA Phase 2', 'name' => 'Genesis Deluxe Cinemas PH', 'type' => 'recreation', 'lat' => 4.8080, 'lng' => 7.0280],
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
