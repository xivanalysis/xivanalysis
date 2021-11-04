import {Attribute} from 'event'
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
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 230,
		combo: {
			start: true,
		},
	},

	GUST_SLASH: {
		id: 2242,
		name: 'Gust Slash',
		icon: 'https://xivapi.com/i/000000/000602.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 2240,
			potency: 340,
		},
	},

	AEOLIAN_EDGE: {
		id: 2255,
		name: 'Aeolian Edge',
		icon: 'https://xivapi.com/i/000000/000605.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
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
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 200,
		cooldown: 70000,
		gcdRecast: 2500,
		statusesApplied: ['SHADOW_FANG'],
	},

	DEATH_BLOSSOM: {
		id: 2254,
		name: 'Death Blossom',
		icon: 'https://xivapi.com/i/000000/000615.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
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
		speedAttribute: Attribute.SKILL_SPEED,
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
		cooldown: 120000,
	},

	ASSASSINATE: {
		id: 2246,
		name: 'Assassinate',
		icon: 'https://xivapi.com/i/000000/000612.png',
		onGcd: false,
		cooldown: 60000,
	},

	TRICK_ATTACK: {
		id: 2258,
		name: 'Trick Attack',
		icon: 'https://xivapi.com/i/000000/000618.png',
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['TRICK_ATTACK_VULNERABILITY_UP'],
	},

	SHADE_SHIFT: {
		id: 2241,
		name: 'Shade Shift',
		icon: 'https://xivapi.com/i/000000/000607.png',
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['SHADE_SHIFT'],
	},
})
