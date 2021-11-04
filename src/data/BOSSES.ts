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

	// 6.0
	// Reason you need to add override info
	// SOME_BOSS: { logId, overrides... },
})

export default BOSSES as Record<keyof typeof BOSSES, Boss>
