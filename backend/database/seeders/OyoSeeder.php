<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OyoSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── State ────────────────────────────────────────────
        $oyoId = Str::uuid()->toString();
        DB::table('states')->insert([
            'id' => $oyoId,
            'name' => 'Oyo',
            'slug' => 'oyo',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── Cities (Oyo LGAs) ─────────────────────────────
        $lgas = [
            'Ibadan North', 'Ibadan South-West', 'Ibadan North-East',
        ];

        $cityIds = [];
        foreach ($lgas as $lga) {
            $id = Str::uuid()->toString();
            $cityIds[$lga] = $id;
            DB::table('cities')->insert([
                'id' => $id,
                'state_id' => $oyoId,
                'name' => $lga,
                'slug' => Str::slug($lga),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── Areas (~10 across Ibadan) ────────────────────────
        $areas = [
            // Ibadan North (4 areas)
            ['city' => 'Ibadan North', 'name' => 'Bodija', 'lat' => 7.4200, 'lng' => 3.9100, 'rent_1br' => 25000000, 'rent_2br' => 40000000, 'rent_3br' => 70000000, 'buy_sqm' => 10000000, 'safety' => 7.0],
            ['city' => 'Ibadan North', 'name' => 'Agodi GRA', 'lat' => 7.4050, 'lng' => 3.9050, 'rent_1br' => 35000000, 'rent_2br' => 60000000, 'rent_3br' => 100000000, 'buy_sqm' => 15000000, 'safety' => 7.5],
            ['city' => 'Ibadan North', 'name' => 'Samonda', 'lat' => 7.4300, 'lng' => 3.8950, 'rent_1br' => 15000000, 'rent_2br' => 25000000, 'rent_3br' => 40000000, 'buy_sqm' => 6000000, 'safety' => 6.0],
            ['city' => 'Ibadan North', 'name' => 'Old Bodija', 'lat' => 7.4150, 'lng' => 3.8900, 'rent_1br' => 20000000, 'rent_2br' => 35000000, 'rent_3br' => 55000000, 'buy_sqm' => 8000000, 'safety' => 6.5],

            // Ibadan South-West (4 areas)
            ['city' => 'Ibadan South-West', 'name' => 'Ring Road', 'lat' => 7.3800, 'lng' => 3.8700, 'rent_1br' => 20000000, 'rent_2br' => 35000000, 'rent_3br' => 55000000, 'buy_sqm' => 8000000, 'safety' => 6.5],
            ['city' => 'Ibadan South-West', 'name' => 'Challenge', 'lat' => 7.3600, 'lng' => 3.8600, 'rent_1br' => 12000000, 'rent_2br' => 20000000, 'rent_3br' => 35000000, 'buy_sqm' => 5000000, 'safety' => 5.5],
            ['city' => 'Ibadan South-West', 'name' => 'Oluyole', 'lat' => 7.3500, 'lng' => 3.8500, 'rent_1br' => 18000000, 'rent_2br' => 30000000, 'rent_3br' => 50000000, 'buy_sqm' => 7000000, 'safety' => 6.0],
            ['city' => 'Ibadan South-West', 'name' => 'Jericho', 'lat' => 7.3700, 'lng' => 3.8600, 'rent_1br' => 30000000, 'rent_2br' => 50000000, 'rent_3br' => 80000000, 'buy_sqm' => 12000000, 'safety' => 7.0],

            // Ibadan North-East (2 areas)
            ['city' => 'Ibadan North-East', 'name' => 'Dugbe', 'lat' => 7.3900, 'lng' => 3.8800, 'rent_1br' => 15000000, 'rent_2br' => 25000000, 'rent_3br' => 40000000, 'buy_sqm' => 6000000, 'safety' => 5.5],
            ['city' => 'Ibadan North-East', 'name' => 'Iyaganku', 'lat' => 7.3850, 'lng' => 3.8750, 'rent_1br' => 25000000, 'rent_2br' => 45000000, 'rent_3br' => 70000000, 'buy_sqm' => 10000000, 'safety' => 7.0],
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

        // ── Landmarks (~5 across Ibadan) ──────────────────
        $this->seedLandmarks($areaIds, $now);
    }

    private function seedLandmarks(array $areaIds, $now): void
    {
        $landmarks = [
            ['area' => 'Bodija', 'name' => 'University of Ibadan', 'type' => 'university', 'lat' => 7.4443, 'lng' => 3.8995],
            ['area' => 'Agodi GRA', 'name' => 'University College Hospital UCH', 'type' => 'hospital', 'lat' => 7.4020, 'lng' => 3.9030],
            ['area' => 'Dugbe', 'name' => 'Cocoa House', 'type' => 'landmark', 'lat' => 7.3880, 'lng' => 3.8780],
            ['area' => 'Ring Road', 'name' => 'Ventura Mall', 'type' => 'mall', 'lat' => 7.3820, 'lng' => 3.8720],
            ['area' => 'Iyaganku', 'name' => 'Adamasingba Stadium', 'type' => 'recreation', 'lat' => 7.3870, 'lng' => 3.8700],
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
