// Samurai Actions
export default {
	//-----
	//Player GCDs
	//-----
	HAKAZE: {
		id: 7477,
		name: 'Hakazae',
		icon: 'https://xivapi.com/i/003000/003151.png',
		onGcd: true,
		potency:  150,
		combo: {
			start: true,
		},
	},

	JINPU: {
		id: 7478,
		name: 'Jinpu',
		icon: 'https://xivapi.com/i/003000/003152.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7477,
			potency: 300,
		},
	},

	ENPI: {
		id: 7486,
		name: 'Enpi',
		icon: 'https://xivapi.com/i/003000/003155.png',
		onGcd: true,
		breaksCombo: true,
	},

	SHIFU: {
		id: 7479,
		name: 'Shifu',
		icon: 'https://xivapi.com/i/003000/003156.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7477,
			potency: 300,
		},
	},

	FUGA: {
		id: 7483,
		name: 'Fuga',
		icon: 'https://xivapi.com/i/003000/003157.png',
		onGcd: true,
		combo: {
			start: true,
		},
	},

	IAIJUTSU: {
		id: 7867,
		name: 'Iaijutsu',
		icon: 'https://xivapi.com/i/003000/003159.png',
		onGcd: true,
		castTime: 1.8,
	},

	HIGANBANA: {
		id: 7489,
		name: 'Higanbana',
		icon: 'https://xivapi.com/i/003000/003160.png',
		onGcd: true,
		castTime: 1.8,
	},

	GEKKO: {
		id: 7481,
		name: 'Gekko',
		icon: 'https://xivapi.com/i/003000/003158.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7478,
			potency: 440,
			end: true,
		},
	},

	MANGETSU: {
		id: 7484,
		name: 'Mangetsu',
		icon: 'https://xivapi.com/i/003000/003163.png',
		onGcd: true,
		potency: 100, // diminishing returns?
		combo: {
			from: 7483,
			potency: 200,
			end: true,
		},
	},

	TENKA_GOKEN: {
		id: 7488,
		name: 'Tenka Goken',
		icon: 'https://xivapi.com/i/003000/003161.png',
		onGcd: true,
		castTime: 1.8,
	},

	KASHA: {
		id: 7482,
		name: 'Kasha',
		icon: 'https://xivapi.com/i/003000/003164.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7479,
			potency: 440,
			end: true,
		},
	},

	OKA: {
		id: 7485,
		name: 'Oka',
		icon: 'https://xivapi.com/i/003000/003165.png',
		onGcd: true,
		potency: 100, // diminishing returns?
		combo: {
			from: 7483,
			potency: 200,
			end: true,
		},
	},

	MIDARE_SETSUGEKKA: {
		id: 7487,
		name: 'Midare Setsugekka',
		icon: 'https://xivapi.com/i/003000/003162.png',
		onGcd: true,
		castTime: 1.8,
	},

	YUKIKAZE: {
		id: 7480,
		name: 'Yukikaze',
		icon: 'https://xivapi.com/i/003000/003166.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7477,
			potency: 380,
			end: true,
		},
	},

	//-----
	//Player OGCDs
	//-----

	THIRD_EYE: {
		id: 7498,
		name: 'Third Eye',
		icon: 'https://xivapi.com/i/003000/003153.png',
		cooldown: 15,
	},

	AGEHA: {
		id: 7500,
		name: 'Ageha',
		icon: 'https://xivapi.com/i/003000/003154.png',
		cooldown: 60,
	},

	MEIKYO_SHISUI: {
		id: 7499,
		name: 'Meikyo Shisui',
		icon: 'https://xivapi.com/i/003000/003167.png',
		cooldown: 80,
	},

	HISSATSU_KAITEN: {
		id: 7494,
		name: 'Hissatsu: Kaiten',
		icon: 'https://xivapi.com/i/003000/003168.png',
		cooldown: 5,
	},

	HISSATSU_GYOTEN: {
		id: 7492,
		name: 'Hissatsu: Gyoten',
		icon: 'https://xivapi.com/i/003000/003169.png',
		cooldown: 10,
	},

	HISSATSU_YATEN: {
		id: 7493,
		name: 'Hissatsu: Yaten',
		icon: 'https://xivapi.com/i/003000/003170.png',
		cooldown: 10,
	},

	MERCIFUL_EYES: {
		id: 7502,
		name: 'Merciful Eyes',
		icon: 'https://xivapi.com/i/003000/003171.png',
		cooldown: 1,
		cooldownGroup: 24,
	},

	MEDITATE: {
		id: 7497,
		name: 'Meditate',
		icon: 'https://xivapi.com/i/003000/003172.png',
		cooldown: 60,
	},

	HISSATSU_SHINTEN: {
		id: 7490,
		name: 'Hissatsu: Shinten',
		icon: 'https://xivapi.com/i/003000/003173.png',
		cooldown: 1,
	},

	HISSATSU_KYUTEN: {
		id: 7491,
		name: 'Hissatsu: Kyuten',
		icon: 'https://xivapi.com/i/003000/003174.png',
		cooldown: 1,
	},

	HISSATSU_SEIGAN: {
		id: 7501,
		name: 'Hissatsu: Seigan',
		icon: 'https://xivapi.com/i/003000/003175.png',
		cooldown: 1,
		cooldownGroup: 24,
	},

	HAGAKURE: {
		id: 7495,
		name: 'Hagakure',
		icon: 'https://xivapi.com/i/003000/003176.png',
		cooldown: 40,
	},

	HISSATSU_GUREN: {
		id: 7496,
		name: 'Hissatsu: Guren',
		icon: 'https://xivapi.com/i/003000/003177.png',
		cooldown: 120,
	},

}
