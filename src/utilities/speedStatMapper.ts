import {matchClosestLower} from 'utilities'

const BASE_SPEED_STAT = 380
const BASE_GCD = 2500

const SPEED_STAT_TABLE: Record<number, number> = {
	380: 2500,
	406: 2490,
	507: 2480,
	609: 2470,
	710: 2460,
	812: 2450,
	914: 2440,
	1015: 2430,
	1117: 2420,
	1218: 2410,
	1320: 2400,
	1421: 2390,
	1523: 2380,
	1624: 2370,
	1726: 2360,
	1827: 2350,
	1929: 2340,
	2030: 2330,
	2132: 2320,
	2234: 2310,
	2335: 2300,
	2437: 2290,
	2538: 2280,
	2640: 2270,
	2741: 2260,
	2843: 2250,
	2944: 2240,
	3046: 2230,
	3147: 2220,
	3249: 2210,
	3350: 2200,
	3452: 2190,
	3554: 2180,
	3655: 2170,
	3757: 2160,
	3858: 2150,
	3960: 2140,
	4061: 2130,
	4163: 2120,
	4264: 2110,
	4366: 2100,
}

export function GetSpeedStat(gcd: number): number {
	for (const key in SPEED_STAT_TABLE) {
		if (SPEED_STAT_TABLE[key] === gcd) {
			return parseInt(key)
		}
	}

	return BASE_SPEED_STAT
}

export function GetGCD(speedStat: number): number {
	return matchClosestLower(SPEED_STAT_TABLE, speedStat) ?? BASE_GCD
}
