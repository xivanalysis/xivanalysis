import {ensureActions} from '../type'

export const ROG = ensureActions({
	// -----
	// Player GCDs
	// -----

	SPINNING_EDGE: {
		id: 2240,
		name: 'Spinning Edge',
		icon: 'https://xivapi.com/i/000000/000601.png',
		onGcd: true,
		potency: 220,
		combo: {
			start: true,
		},
	},

	GUST_SLASH: {
		id: 2242,
		name: 'Gust Slash',
		icon: 'https://xivapi.com/i/000000/000602.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 2240,
			potency: 330,
		},
	},

	AEOLIAN_EDGE: {
		id: 2255,
		name: 'Aeolian Edge',
		icon: 'https://xivapi.com/i/000000/000605.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 2242,
			potency: 480, // TODO - *Cries in positionals*
			end: true,
		},
	},

	SHADOW_FANG: {
		id: 2257,
		name: 'Shadow Fang',
		icon: 'https://xivapi.com/i/000000/000606.png',
		onGcd: true,
		potency: 200,
		cooldown: 70,
		gcdRecast: 2.5,
		statusesApplied: ['SHADOW_FANG'],
	},

	DEATH_BLOSSOM: {
		id: 2254,
		name: 'Death Blossom',
		icon: 'https://xivapi.com/i/000000/000615.png',
		onGcd: true,
		potency: 120,
		combo: {
			start: true,
		},
	},

	THROWING_DAGGER: {
		id: 2247,
		name: 'Throwing Dagger',
		icon: 'https://xivapi.com/i/000000/000614.png',
		onGcd: true,
		potency: 120,
		breaksCombo: true,
	},

	// -----
	// Player OGCDs
	// -----

	MUG: {
		id: 2248,
		name: 'Mug',
		icon: 'https://xivapi.com/i/000000/000613.png',
		onGcd: false,
		cooldown: 120,
	},

	ASSASSINATE: {
		id: 2246,
		name: 'Assassinate',
		icon: 'https://xivapi.com/i/000000/000612.png',
		onGcd: false,
		cooldown: 60,
	},

	TRICK_ATTACK: {
		id: 2258,
		name: 'Trick Attack',
		icon: 'https://xivapi.com/i/000000/000618.png',
		onGcd: false,
		cooldown: 60,
		statusesApplied: ['TRICK_ATTACK_VULNERABILITY_UP'],
	},

	SHADE_SHIFT: {
		id: 2241,
		name: 'Shade Shift',
		icon: 'https://xivapi.com/i/000000/000607.png',
		onGcd: false,
		cooldown: 120,
		statusesApplied: ['SHADE_SHIFT'],
	},
})
