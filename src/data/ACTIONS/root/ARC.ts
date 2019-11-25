import STATUSES from 'data/STATUSES'
import {ensureActions} from '../type'

export const ARC = ensureActions({
	HEAVY_SHOT: {
		id: 97,
		name: 'Heavy Shot',
		icon: 'https://xivapi.com/i/000000/000358.png',
		onGcd: true,
		potency: 180,
	},
	VENOMOUS_BITE: {
		id: 100,
		name: 'Venomous Bite',
		icon: 'https://xivapi.com/i/000000/000363.png',
		onGcd: true,
		potency: 100,
	},
	QUICK_NOCK: {
		id: 106,
		name: 'Quick Nock',
		icon: 'https://xivapi.com/i/000000/000360.png',
		onGcd: true,
		potency: 150,
	},
	BLOODLETTER: {
		id: 110,
		name: 'Bloodletter',
		icon: 'https://xivapi.com/i/000000/000361.png',
		onGcd: false,
		cooldown: 15,
		potency: 150,
	},
	STRAIGHT_SHOT: {
		id: 98,
		name: 'Straight Shot',
		icon: 'https://xivapi.com/i/000000/000359.png',
		onGcd: true,
		potency: 200,
	},
	BARRAGE: {
		id: 107,
		name: 'Barrage',
		icon: 'https://xivapi.com/i/000000/000353.png',
		onGcd: false,
		cooldown: 80,
		statusesApplied: [STATUSES.BARRAGE],
	},
	WINDBITE: {
		id: 113,
		name: 'Windbite',
		icon: 'https://xivapi.com/i/000000/000367.png',
		onGcd: true,
		potency: 60,
	},
	RAGING_STRIKES: {
		id: 101,
		name: 'Raging Strikes',
		icon: 'https://xivapi.com/i/000000/000352.png',
		onGcd: false,
		cooldown: 80,
		statusesApplied: [STATUSES.RAGING_STRIKES],
	},
	REPELLING_SHOT: {
		id: 112,
		name: 'Repelling Shot',
		icon: 'https://xivapi.com/i/000000/000366.png',
		onGcd: false,
		cooldown: 30,
	},
})
