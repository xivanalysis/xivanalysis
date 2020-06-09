import {getDataBy} from 'data'
import {Fight} from 'fflogs'

export interface Boss {
	logId: number
	overrides?: Partial<Fight>
}

const ensureBosses = <T extends Record<string, Boss>>(bosses: T): {[K in keyof T]: T[K] & Boss} => bosses

// Correct fight info with manual overrides
export const getCorrectedFight = (fight: Fight): Fight => {
	const boss = getDataBy(BOSSES, 'logId', fight.boss)

	return {
		...fight,
		...boss?.overrides,
	}
}

// Helper to calculate the URL to a zone banner (using my proxy)
export const getZoneBanner = (zoneId: number) => zoneId >= 0
	? `https://xivanalysis.com/xivapi/zone-banner/${zoneId}`
	: undefined

const BOSSES = ensureBosses({
	// Special case - FF Logs reports trash fights with a boss ID of 0
	TRASH: {
		logId: 0,
		overrides: {zoneID: -1, zoneName: 'Trash'},
	},

	// 5.0
	// Reason you need to add override info
	// SOME_BOSS: { logId, overrides... },

	// 24mans
	NIER1: {logId: 2020},
	NIER2: {logId: 2021},
	NIER3: {logId: 2022},
	NIER4: {logId: 2023},

	// Trials
	TITANIA: {logId: 1045},
	INNOCENCE: {logId: 1046},
	HADES: {logId: 1049},
	RUBY_WEAPON_1: {logId: 1051},
	RUBY_WEAPON_2: {logId: 1052},
	VARIS_YAE_GALVUS: {logId: 1053},

	// Raids (savage and normal share log boss IDs)
	E1: {logId: 65},
	E2: {logId: 66},
	E3: {logId: 67},
	E4: {logId: 68},
	E5: {logId: 69},
	E6: {logId: 70},
	E7: {logId: 71},
	E8: {logId: 72},

	// Ultimates
	TEA: {logId: 1050},
})

export default BOSSES as Record<keyof typeof BOSSES, Boss>
