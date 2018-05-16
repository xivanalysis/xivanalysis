import { addExtraIndex } from 'utilities'

// TODO: MCH pets
// TODO: SCH pets
// IDs aren't real IDs per se. Just fudging with summon action IDs and stuff
const PETS = {
	EMERALD_CARBUNCLE: {
		id: 1650,
		name: 'Emerald Carbuncle'
	},

	TOPAZ_CARBUNCLE: {
		id: 1700,
		name: 'Topaz Carbuncle'
	},

	GARUDA_EGI: {
		id: 1651,
		name: 'Garuda-Egi'
	},

	TITAN_EGI: {
		id: 1701,
		name: 'Titan-Egi'
	},

	IFRIT_EGI: {
		id: 180,
		name: 'Ifrit-Egi'
	},

	DEMI_BAHAMUT: {
		id: 7427,
		name: 'Demi-Bahamut'
	}
}

export default addExtraIndex(PETS, 'id')
