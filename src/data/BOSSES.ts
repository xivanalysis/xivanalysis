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
export const getZoneBanner = (zoneId: number) =>
	zoneId >= 0 && `https://xivanalysis.com/xivapi/zone-banner/${zoneId}`

const BOSSES = ensureBosses({
	// Special case - FF Logs reports trash fights with a boss ID of 0
	TRASH: {
		logId: 0,
		overrides: {zoneID: -1, zoneName: 'Trash'},
	},

	// 5.0
	// Reason you need to add override info
	// SOME_BOSS: { logId, overrides... },

	TITANIA: {logId: 1045},
	INNOCENCE: {logId: 1046},
	HADES: {logId: 1049},
	RUBY_WEAPON_1: {logId: 1051},
	RUBY_WEAPON_2: {logId: 1052},
	VARIS_YAE_GALVUS: {logId: 1053},

	E1S: {logId: 65},
	E2S: {logId: 66},
	E3S: {logId: 67},
	E4S: {logId: 68},
	E5S: {logId: 69},
	E6S: {logId: 70},
	E7S: {logId: 71},
	E8S: {logId: 72},
})

export default BOSSES as Record<keyof typeof BOSSES, Boss>
