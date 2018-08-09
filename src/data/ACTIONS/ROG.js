export default {
	// -----
	// Player GCDs
	// -----

	SPINNING_EDGE: {
		id: 2240,
		name: 'Spinning Edge',
		icon: 'https://secure.xivdb.com/img/game/000000/000601.png',
		onGcd: true,
		potency: 150,
		combo: {
			start: true,
		},
	},

	GUST_SLASH: {
		id: 2242,
		name: 'Gust Slash',
		icon: 'https://secure.xivdb.com/img/game/000000/000602.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 2240,
			potency: 200,
		},
	},

	AEOLIAN_EDGE: {
		id: 2255,
		name: 'Aeolian Edge',
		icon: 'https://secure.xivdb.com/img/game/000000/000605.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 2242,
			potency: 340, // TODO - *Cries in positionals*
			end: true,
		},
	},

	SHADOW_FANG: {
		id: 2257,
		name: 'Shadow Fang',
		icon: 'https://secure.xivdb.com/img/game/000000/000606.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 2242,
			potency: 200,
			end: true,
		},
	},

	DEATH_BLOSSOM: {
		id: 2254,
		name: 'Death Blossom',
		icon: 'https://secure.xivdb.com/img/game/000000/000615.png',
		onGcd: true,
		potency: 110,
		breaksCombo: true,
	},

	THROWING_DAGGER: {
		id: 2247,
		name: 'Throwing Dagger',
		icon: 'https://secure.xivdb.com/img/game/000000/000614.png',
		onGcd: true,
		potency: 120,
		breaksCombo: true,
	},

	// -----
	// Player OGCDs
	// -----

	JUGULATE: {
		id: 2256,
		name: 'Jugulate',
		icon: 'https://secure.xivdb.com/img/game/000000/000616.png',
		onGcd: false,
		cooldown: 30,
	},

	MUG: {
		id: 2248,
		name: 'Mug',
		icon: 'https://secure.xivdb.com/img/game/000000/000613.png',
		onGcd: false,
		cooldown: 90,
	},

	ASSASSINATE: {
		id: 2246,
		name: 'Assassinate',
		icon: 'https://secure.xivdb.com/img/game/000000/000612.png',
		onGcd: false,
		cooldown: 40,
	},

	TRICK_ATTACK: {
		id: 2258,
		name: 'Trick Attack',
		icon: 'https://secure.xivdb.com/img/game/000000/000618.png',
		onGcd: false,
		cooldown: 60,
	},

	SHADE_SHIFT: {
		id: 2241,
		name: 'Shade Shift',
		icon: 'https://secure.xivdb.com/img/game/000000/000607.png',
		onGcd: false,
		cooldown: 120,
	},
}
