export interface Pet {
	id: number
	name: string
}

// IDs aren't real IDs per se. Just fudging with summon action IDs and stuff
const PETS = {
	// SCH
	EOS: {
		id: 1652,
		name: 'Eos',
	},

	SELENE: {
		id: 1702,
		name: 'Selene',
	},

	// SMN
	EMERALD_CARBUNCLE: {
		id: 1650,
		name: 'Emerald Carbuncle',
	},

	TOPAZ_CARBUNCLE: {
		id: 1700,
		name: 'Topaz Carbuncle',
	},

	GARUDA_EGI: {
		id: 1651,
		name: 'Garuda-Egi',
	},

	TITAN_EGI: {
		id: 1701,
		name: 'Titan-Egi',
	},

	IFRIT_EGI: {
		id: 180,
		name: 'Ifrit-Egi',
	},

	DEMI_BAHAMUT: {
		id: 7427,
		name: 'Demi-Bahamut',
	},

	DEMI_PHOENIX: {
		id: 16549,
		name: 'Demi-Phoenix',
	},

	// MCH
	ROOK_AUTOTURRET: {
		id: 2864,
		name: 'Rook Autoturret',
	},

	BISHOP_AUTOTURRET: {
		id: 2865,
		name: 'Bishop Autoturret',
	},
}

export default PETS as Record<keyof typeof PETS, Pet>
