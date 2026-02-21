<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AbujaSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── State ────────────────────────────────────────────
        $fctId = Str::uuid()->toString();
        DB::table('states')->insert([
            'id' => $fctId,
            'name' => 'Federal Capital Territory',
            'slug' => 'federal-capital-territory',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── Cities (FCT Area Councils) ─────────────────────
        $councils = [
            'AMAC', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji',
        ];

        $cityIds = [];
        foreach ($councils as $council) {
            $id = Str::uuid()->toString();
            $cityIds[$council] = $id;
            DB::table('cities')->insert([
                'id' => $id,
                'state_id' => $fctId,
                'name' => $council,
                'slug' => Str::slug($council),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── Areas (22 across Abuja) ───────────────────────
        $areas = [
            // AMAC (18 areas)
            ['city' => 'AMAC', 'name' => 'Maitama', 'lat' => 9.0820, 'lng' => 7.4920, 'rent_1br' => 200000000, 'rent_2br' => 400000000, 'rent_3br' => 700000000, 'buy_sqm' => 80000000, 'safety' => 9.0],
            ['city' => 'AMAC', 'name' => 'Asokoro', 'lat' => 9.0420, 'lng' => 7.5310, 'rent_1br' => 180000000, 'rent_2br' => 350000000, 'rent_3br' => 600000000, 'buy_sqm' => 70000000, 'safety' => 9.0],
            ['city' => 'AMAC', 'name' => 'Wuse', 'lat' => 9.0650, 'lng' => 7.4850, 'rent_1br' => 100000000, 'rent_2br' => 180000000, 'rent_3br' => 300000000, 'buy_sqm' => 40000000, 'safety' => 7.5],
            ['city' => 'AMAC', 'name' => 'Wuse 2', 'lat' => 9.0720, 'lng' => 7.4790, 'rent_1br' => 120000000, 'rent_2br' => 200000000, 'rent_3br' => 350000000, 'buy_sqm' => 45000000, 'safety' => 8.0],
            ['city' => 'AMAC', 'name' => 'Garki', 'lat' => 9.0340, 'lng' => 7.4870, 'rent_1br' => 80000000, 'rent_2br' => 150000000, 'rent_3br' => 250000000, 'buy_sqm' => 35000000, 'safety' => 7.5],
            ['city' => 'AMAC', 'name' => 'Garki 2', 'lat' => 9.0280, 'lng' => 7.4920, 'rent_1br' => 70000000, 'rent_2br' => 130000000, 'rent_3br' => 220000000, 'buy_sqm' => 30000000, 'safety' => 7.0],
            ['city' => 'AMAC', 'name' => 'Jabi', 'lat' => 9.0680, 'lng' => 7.4230, 'rent_1br' => 80000000, 'rent_2br' => 150000000, 'rent_3br' => 250000000, 'buy_sqm' => 30000000, 'safety' => 7.5],
            ['city' => 'AMAC', 'name' => 'Utako', 'lat' => 9.0750, 'lng' => 7.4350, 'rent_1br' => 70000000, 'rent_2br' => 120000000, 'rent_3br' => 200000000, 'buy_sqm' => 25000000, 'safety' => 7.0],
            ['city' => 'AMAC', 'name' => 'Gwarinpa', 'lat' => 9.1050, 'lng' => 7.4080, 'rent_1br' => 60000000, 'rent_2br' => 100000000, 'rent_3br' => 180000000, 'buy_sqm' => 20000000, 'safety' => 7.5],
            ['city' => 'AMAC', 'name' => 'Life Camp', 'lat' => 9.0900, 'lng' => 7.4000, 'rent_1br' => 70000000, 'rent_2br' => 120000000, 'rent_3br' => 200000000, 'buy_sqm' => 22000000, 'safety' => 7.0],
            ['city' => 'AMAC', 'name' => 'Katampe', 'lat' => 9.0850, 'lng' => 7.4650, 'rent_1br' => 80000000, 'rent_2br' => 150000000, 'rent_3br' => 250000000, 'buy_sqm' => 28000000, 'safety' => 7.5],
            ['city' => 'AMAC', 'name' => 'Durumi', 'lat' => 9.0300, 'lng' => 7.4600, 'rent_1br' => 50000000, 'rent_2br' => 80000000, 'rent_3br' => 130000000, 'buy_sqm' => 18000000, 'safety' => 6.5],
            ['city' => 'AMAC', 'name' => 'Gudu', 'lat' => 9.0200, 'lng' => 7.4700, 'rent_1br' => 50000000, 'rent_2br' => 80000000, 'rent_3br' => 130000000, 'buy_sqm' => 18000000, 'safety' => 6.5],
            ['city' => 'AMAC', 'name' => 'Kado', 'lat' => 9.0800, 'lng' => 7.4500, 'rent_1br' => 60000000, 'rent_2br' => 100000000, 'rent_3br' => 180000000, 'buy_sqm' => 22000000, 'safety' => 7.0],
            ['city' => 'AMAC', 'name' => 'Apo', 'lat' => 9.0150, 'lng' => 7.5000, 'rent_1br' => 40000000, 'rent_2br' => 70000000, 'rent_3br' => 120000000, 'buy_sqm' => 15000000, 'safety' => 6.5],
            ['city' => 'AMAC', 'name' => 'Mabushi', 'lat' => 9.0820, 'lng' => 7.4400, 'rent_1br' => 60000000, 'rent_2br' => 100000000, 'rent_3br' => 170000000, 'buy_sqm' => 20000000, 'safety' => 7.0],
            ['city' => 'AMAC', 'name' => 'Lugbe', 'lat' => 8.9800, 'lng' => 7.4700, 'rent_1br' => 25000000, 'rent_2br' => 40000000, 'rent_3br' => 70000000, 'buy_sqm' => 8000000, 'safety' => 6.0],
            ['city' => 'AMAC', 'name' => 'Lokogoma', 'lat' => 8.9900, 'lng' => 7.4500, 'rent_1br' => 30000000, 'rent_2br' => 50000000, 'rent_3br' => 80000000, 'buy_sqm' => 10000000, 'safety' => 6.5],

            // Bwari (2 areas)
            ['city' => 'Bwari', 'name' => 'Kubwa', 'lat' => 9.1200, 'lng' => 7.3500, 'rent_1br' => 20000000, 'rent_2br' => 35000000, 'rent_3br' => 60000000, 'buy_sqm' => 6000000, 'safety' => 6.0],
            ['city' => 'Bwari', 'name' => 'Bwari', 'lat' => 9.2800, 'lng' => 7.3800, 'rent_1br' => 15000000, 'rent_2br' => 25000000, 'rent_3br' => 45000000, 'buy_sqm' => 4000000, 'safety' => 5.5],

            // Gwagwalada (1 area)
            ['city' => 'Gwagwalada', 'name' => 'Gwagwalada', 'lat' => 8.9400, 'lng' => 7.0800, 'rent_1br' => 12000000, 'rent_2br' => 20000000, 'rent_3br' => 35000000, 'buy_sqm' => 3000000, 'safety' => 5.5],

            // Kuje (1 area)
            ['city' => 'Kuje', 'name' => 'Kuje', 'lat' => 8.8800, 'lng' => 7.2300, 'rent_1br' => 10000000, 'rent_2br' => 18000000, 'rent_3br' => 30000000, 'buy_sqm' => 2500000, 'safety' => 5.0],
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

        // ── Landmarks (10 across Abuja) ──────────────────
        $this->seedLandmarks($areaIds, $now);
    }

    private function seedLandmarks(array $areaIds, $now): void
    {
        $landmarks = [
            ['area' => 'Asokoro', 'name' => 'Aso Rock Presidential Villa', 'type' => 'government', 'lat' => 9.0480, 'lng' => 7.5200],
            ['area' => 'Maitama', 'name' => 'National Assembly Complex', 'type' => 'government', 'lat' => 9.0550, 'lng' => 7.5100],
            ['area' => 'Garki', 'name' => 'Abuja National Mosque', 'type' => 'worship', 'lat' => 9.0580, 'lng' => 7.4920],
            ['area' => 'Garki', 'name' => 'National Church of Nigeria', 'type' => 'worship', 'lat' => 9.0530, 'lng' => 7.4950],
            ['area' => 'Jabi', 'name' => 'Jabi Lake Mall', 'type' => 'mall', 'lat' => 9.0650, 'lng' => 7.4200],
            ['area' => 'Wuse', 'name' => 'Ceddi Plaza', 'type' => 'mall', 'lat' => 9.0630, 'lng' => 7.4860],
            ['area' => 'Garki', 'name' => 'National Hospital Abuja', 'type' => 'hospital', 'lat' => 9.0310, 'lng' => 7.4830],
            ['area' => 'Lugbe', 'name' => 'Nnamdi Azikiwe International Airport', 'type' => 'airport', 'lat' => 9.0068, 'lng' => 7.2632],
            ['area' => 'Maitama', 'name' => 'Millennium Park', 'type' => 'recreation', 'lat' => 9.0720, 'lng' => 7.4780],
            ['area' => 'Gwagwalada', 'name' => 'University of Abuja', 'type' => 'university', 'lat' => 8.9500, 'lng' => 7.0600],
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
