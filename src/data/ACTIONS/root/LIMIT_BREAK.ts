import {ensureActions} from '../type'

const icon = 'https://xivapi.com/i/000000/000103.png'

export const LIMIT_BREAK = ensureActions({
	// Tank LB1
	SHIELD_WALL: {
		id: 197,
		name: 'Shield Wall',
		onGcd: true,
		gcdRecast: 1930,
		icon,
	},

	// Tank LB2
	STRONGHOLD: {
		id: 198,
		name: 'Stronghold',
		onGcd: true,
		gcdRecast: 3860,
		icon,
	},

	// PLD LB3
	LAST_BASTION: {
		id: 199,
		name: 'Last Bastion',
		onGcd: true,
		gcdRecast: 3860,
		icon,
	},

	// WAR LB3
	LAND_WAKER: {
		id: 4240,
		name: 'Land Waker',
		onGcd: true,
		gcdRecast: 3860,
		icon,
	},

	// DRK LB3
	DARK_FORCE: {
		id: 4241,
		name: 'Dark Force',
		onGcd: true,
		gcdRecast: 3860,
		icon,
	},

	// GNB LB3,
	GUNMETAL_SOUL: {
		id: 17105,
		name: 'Gunmetal Soul',
		onGcd: true,
		gcdRecast: 3860,
		icon,
	},

	// Healer LB1
	HEALING_WIND: {
		id: 206,
		name: 'Healing Wind',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 4100,
		icon,
	},

	// Healer LB2
	BREATH_OF_THE_EARTH: {
		id: 207,
		name: 'Breath of the Earth',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 7130,
		icon,
	},

	// WHM LB3
	PULSE_OF_LIFE: {
		id: 208,
		name: 'Pulse of Life',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 10100,
		icon,
	},

	// SCH LB3
	ANGEL_FEATHERS: {
		id: 4247,
		name: 'Angel Feathers',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 10100,
		icon,
	},

	// AST LB3
	ASTRAL_STASIS: {
		id: 4248,
		name: 'Astral Stasis',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 10100,
		icon,
	},

	// SGE LB3
	TECHNE_MAKRE: {
		id: 24859,
		name: 'Techne Makre',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 10100,
		icon,
	},

	// Melee LB1
	BRAVER: {
		id: 200,
		name: 'Braver',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 5860,
		icon,
	},

	// Melee LB2
	BLADEDANCE: {
		id: 201,
		name: 'Bladedance',
		onGcd: true,
		castTime: 3000,
		gcdRecast: 6860,
		icon,
	},

	// MNK LB3
	FINAL_HEAVEN: {
		id: 202,
		name: 'Final Heaven',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 8200,
		icon,
	},

	// DRG LB3
	DRAGONSONG_DIVE: {
		id: 4242,
		name: 'Dragonsong Dive',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 8200,
		icon,
	},

	// NIN LB3
	CHIMATSURI: {
		id: 4243,
		name: 'Chimatsuri',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 8200,
		icon,
	},

	// SAM LB3
	DOOM_OF_THE_LIVING: {
		id: 7861,
		name: 'Doom of the Living',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 8200,
		icon,
	},

	// RPR LB3
	THE_END: {
		id: 24858,
		name: 'the End',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 8200,
		icon,
	},

	// Ranged LB1
	BIG_SHOT: {
		id: 4238,
		name: 'Big Shot',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 5100,
		icon,
	},

	// Ranged LB2
	DESPERADO: {
		id: 4239,
		name: 'Desperado',
		onGcd: true,
		castTime: 3100,
		gcdRecast: 6100,
		icon,
	},

	// BRD LB3
	SAGITTARIUS_ARROW: {
		id: 4244,
		name: 'Sagittarius Arrow',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 8200,
		icon,
	},

	// MCH LB3
	SATELLITE_BEAM: {
		id: 4245,
		name: 'Satellite Beam',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 8200,
		icon,
	},

	// DNC LB3
	CRIMSON_LOTUS: {
		id: 17106,
		name: 'Crimson Lotus',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 8200,
		icon,
	},

	// Caster LB1
	SKYSHARD: {
		id: 203,
		name: 'Skyshard',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 5100,
		icon,
	},

	// Caster LB2
	STARSTORM: {
		id: 204,
		name: 'Starstorm',
		onGcd: true,
		castTime: 3000,
		gcdRecast: 8100,
		icon,
	},

	// BLM LB3
	METEOR: {
		id: 205,
		name: 'Meteor',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 12600,
		icon,
	},

	// SMN LB3
	TERAFLARE: {
		id: 4246,
		name: 'Teraflare',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 12600,
		icon,
	},

	// RDM LB3
	VERMILION_SCOURGE: {
		id: 7862,
		name: 'Vermilion Scourge',
		onGcd: true,
		castTime: 4500,
		gcdRecast: 12600,
		icon,
	},
})
