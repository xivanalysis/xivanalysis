export default {
	// -----
	// Cooldowns
	// -----
	EMBOLDEN: {
		id: 7520,
		name: 'Embolden',
		icon: 'https://secure.xivdb.com/img/game/003000/003218.png',
		cooldown: 120,
		preservesCombo: true,
	},
	ACCELERATION: {
		id: 7518,
		name: 'Acceleration',
		icon: 'https://secure.xivdb.com/img/game/003000/003214.png',
		cooldown: 35,
		preservesCombo: true,
	},
	MANAFICATION: {
		id: 7521,
		name: 'Manafication',
		icon: 'https://secure.xivdb.com/img/game/003000/003219.png',
		cooldown: 120,
	},
	CONTRE_SIXTE: {
		id: 7519,
		name: 'Contre Sixte',
		icon: 'https://secure.xivdb.com/img/game/003000/003217.png',
		cooldown: 45,
		preservesCombo: true,
		potency: 300, //Note 2nd enemy takes 10% less, 3rd 20%, 4th 30%, 5th 40%, and beyond 50%
	},
	DISPLACEMENT: {
		id: 7515,
		name: 'Displacement',
		icon: 'https://secure.xivdb.com/img/game/003000/003211.png',
		cooldown: 35,
		preservesCombo: true,
		potency: 130,
	},
	CORPS_A_CORPS: {
		id: 7506,
		name: 'Corps-a-corps',
		icon: 'https://secure.xivdb.com/img/game/003000/003204.png',
		cooldown: 40,
		preservesCombo: true,
		potency: 130,
	},
	FLECHE: {
		id: 7517,
		name: 'Fleche',
		icon: 'https://secure.xivdb.com/img/game/003000/003212.png',
		cooldown: 25,
		preservesCombo: true,
		potency: 420,
	},

	// -----
	// Actions
	// -----
	RIPOSTE: {
		id: 7504,
		name: 'Riposte',
		icon: 'https://secure.xivdb.com/img/game/003000/003201.png',
		onGcd: true,
		cooldown: 2.5,
		potency: 130,
	},
	ENCHANTED_RIPOSTE: {
		id: 7527,
		name: 'Enchanted Riposte',
		icon: 'https://secure.xivdb.com/img/game/003000/003225.png',
		onGcd: true,
		cooldown: 1.5,
		potency: 210, //consumes 30 white, 30 black
	},
	ZWERCHHAU: {
		id: 7512,
		name: 'Zwerchhau',
		icon: 'https://secure.xivdb.com/img/game/003000/003210.png',
		onGcd: true,
		cooldown: 2.5,
		potency: 100,
		combo: {
			from: 7504,
			potency: 150,
		},
	},
	ENCHANTED_ZWERCHHAU: {
		id: 7528,
		name: 'Enchanted Zwerchhau',
		icon: 'https://secure.xivdb.com/img/game/003000/003226.png',
		onGcd: true,
		cooldown: 1.5,
		potency: 100, //consumes 25 white, 25 black
		combo: {
			from: 7527,
			potency: 290,
		},
	},
	REDOUBLEMENT: {
		id: 7516,
		name: 'Redoublement',
		icon: 'https://secure.xivdb.com/img/game/003000/003213.png',
		onGcd: true,
		cooldown: 2.5,
		potency: 100,
		combo: {
			from: 7512,
			potency: 230,
		},
	},
	ENCHANTED_REDOUBLEMENT: {
		id: 7529,
		name: 'Enchanted Redoublement',
		icon: 'https://secure.xivdb.com/img/game/003000/003227.png',
		onGcd: true,
		cooldown: 1.5,
		potency: 100, //consumes 25 white, 25 black
		combo: {
			from: 7528,
			potency: 470,
		},
	},
	VERFLARE: {
		id: 7525,
		name: 'Verflare',
		icon: 'https://secure.xivdb.com/img/game/003000/003223.png',
		onGcd: true,
		cooldown: 2.5,
		potency: 550, //Gains 21 Black Mana, if Black is lower 100% Verfire ready
		combo: {
			from: 7529,
			potency: 550,
		},
	},
	VERHOLY: {
		id: 7526,
		name: 'Verholy',
		icon: 'https://secure.xivdb.com/img/game/003000/003224.png',
		onGcd: true,
		cooldown: 2.5,
		potency: 550, //Gains 21 white, if White is lower 100% Verstone ready
		combo: {
			from: 7529,
			potency: 550,
		},
	},
	JOLT: {
		id: 7503,
		name: 'Jolt',
		icon: 'https://secure.xivdb.com/img/game/003000/003202.png',
		onGcd: true,
		cooldown: 2.5,
		potency: 180,
		castTime: 2, //Increase White and Black by 3
	},
	JOLT_II: {
		id: 7524,
		name: 'Jolt II',
		icon: 'https://secure.xivdb.com/img/game/003000/003220.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 2,
		potency: 240, //Increase White and Black by 3
	},
	IMPACT: {
		id: 7522,
		name: 'Impact',
		icon: 'https://secure.xivdb.com/img/game/003000/003222.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 2,
		potency: 270, //Increase White and Black by 4
	},
	VERTHUNDER: {
		id: 7505,
		name: 'Verthunder',
		icon: 'https://secure.xivdb.com/img/game/003000/003203.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 5,
		potency: 300, //Increase Black by 11
	},
	VERFIRE: {
		id: 7510,
		name: 'Verfire',
		icon: 'https://secure.xivdb.com/img/game/003000/003208.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 2,
		potency: 270, //Increase Black by 9
	},
	VERAREO: {
		id: 7507,
		name: 'Verareo',
		icon: 'https://secure.xivdb.com/img/game/003000/003205.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 5,
		potency: 300, //Increase White by 11
	},
	VERSTONE: {
		id: 7511,
		name: 'Verstone',
		icon: 'https://secure.xivdb.com/img/game/003000/003209.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 2,
		potency: 270, //Increase White by 9
	},
	TETHER: {
		id: 7508,
		name: 'Tether',
		icon: 'https://secure.xivdb.com/img/game/003000/003206.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 2.5,
	},
	SCATTER: {
		id: 7509,
		name: 'Scatter',
		icon: 'https://secure.xivdb.com/img/game/003000/003207.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 2,
		potency: 100, //Increase White and black by 3
	},
	MOULINET: {
		id: 7513,
		name: 'Moulinet',
		icon: 'https://secure.xivdb.com/img/game/003000/003215.png',
		onGcd: true,
		cooldown: 2.5,
		potency: 60,
	},
	ENCHANTED_MOULINET: {
		id: 7530,
		name: 'Enchanted Moulinet',
		icon: 'https://secure.xivdb.com/img/game/003000/003228.png',
		onGcd: true,
		cooldown: 1.5,
		potency: 200, //Costs 30 White and Black
	},
	VERCURE: {
		id: 7514,
		name: 'Vercure',
		icon: 'https://secure.xivdb.com/img/game/003000/003216.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 2,
		potency: 350,
	},
	VERRAISE: {
		id: 7523,
		name: 'Verraise',
		icon: 'https://secure.xivdb.com/img/game/003000/003221.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 10,
	},
}
