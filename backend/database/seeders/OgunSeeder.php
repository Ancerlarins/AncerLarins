<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OgunSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── State ────────────────────────────────────────────
        $ogunId = Str::uuid()->toString();
        DB::table('states')->insert([
            'id' => $ogunId,
            'name' => 'Ogun',
            'slug' => 'ogun',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── Cities (Ogun LGAs) ─────────────────────────────
        $lgas = [
            'Abeokuta South', 'Ijebu-Ode',
        ];

        $cityIds = [];
        foreach ($lgas as $lga) {
            $id = Str::uuid()->toString();
            $cityIds[$lga] = $id;
            DB::table('cities')->insert([
                'id' => $id,
                'state_id' => $ogunId,
                'name' => $lga,
                'slug' => Str::slug($lga),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── Areas (6 across Ogun) ────────────────────────
        $areas = [
            // Abeokuta South (4 areas)
            ['city' => 'Abeokuta South', 'name' => 'Abeokuta GRA', 'lat' => 7.1500, 'lng' => 3.3500, 'rent_1br' => 20000000, 'rent_2br' => 35000000, 'rent_3br' => 55000000, 'buy_sqm' => 8000000, 'safety' => 7.0],
            ['city' => 'Abeokuta South', 'name' => 'Oke-Ilewo', 'lat' => 7.1550, 'lng' => 3.3400, 'rent_1br' => 12000000, 'rent_2br' => 20000000, 'rent_3br' => 35000000, 'buy_sqm' => 5000000, 'safety' => 6.0],
            ['city' => 'Abeokuta South', 'name' => 'Ibara', 'lat' => 7.1600, 'lng' => 3.3450, 'rent_1br' => 15000000, 'rent_2br' => 25000000, 'rent_3br' => 40000000, 'buy_sqm' => 6000000, 'safety' => 6.5],
            ['city' => 'Abeokuta South', 'name' => 'Kuto', 'lat' => 7.1450, 'lng' => 3.3500, 'rent_1br' => 10000000, 'rent_2br' => 18000000, 'rent_3br' => 30000000, 'buy_sqm' => 4000000, 'safety' => 5.5],

            // Ijebu-Ode (2 areas)
            ['city' => 'Ijebu-Ode', 'name' => 'Ijebu-Ode GRA', 'lat' => 6.8200, 'lng' => 3.9200, 'rent_1br' => 12000000, 'rent_2br' => 20000000, 'rent_3br' => 35000000, 'buy_sqm' => 4000000, 'safety' => 6.5],
            ['city' => 'Ijebu-Ode', 'name' => 'Ijebu-Ode', 'lat' => 6.8150, 'lng' => 3.9100, 'rent_1br' => 8000000, 'rent_2br' => 15000000, 'rent_3br' => 25000000, 'buy_sqm' => 3000000, 'safety' => 6.0],
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

        // ── Landmarks (3 across Ogun) ──────────────────
        $this->seedLandmarks($areaIds, $now);
    }

    private function seedLandmarks(array $areaIds, $now): void
    {
        $landmarks = [
            ['area' => 'Ibara', 'name' => 'Olumo Rock', 'type' => 'landmark', 'lat' => 7.1580, 'lng' => 3.3430],
            ['area' => 'Abeokuta GRA', 'name' => 'Federal University of Agriculture Abeokuta', 'type' => 'university', 'lat' => 7.2290, 'lng' => 3.4440],
            ['area' => 'Oke-Ilewo', 'name' => 'Ogun State Government House', 'type' => 'government', 'lat' => 7.1530, 'lng' => 3.3380],
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
