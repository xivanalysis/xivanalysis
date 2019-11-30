import {ensureActions} from '../type'

// Items need to be cast, so they appear (and are used as) actions
// TODO: Should I keep items in a seperate data/ import and just translate to actions here, or keep as-is?

// tslint:disable:no-magic-numbers

export const ITEM_ID_OFFSET = 1000000

const ITEMS = ensureActions({
	INFUSION_STR: {
		id: 19886,
		name: 'Infusion of Strength',
		icon: 'https://xivapi.com/i/020000/020701.png',
		duration: 30,
	},

	INFUSION_DEX: {
		id: 19887,
		name: 'Infusion of Dexterity',
		icon: 'https://xivapi.com/i/020000/020702.png',
		duration: 30,
	},

	INFUSION_VIT: {
		id: 19888,
		name: 'Infusion of Vitality',
		icon: 'https://xivapi.com/i/020000/020703.png',
		duration: 30,
	},

	INFUSION_INT: {
		id: 19889,
		name: 'Infusion of Intelligence',
		icon: 'https://xivapi.com/i/020000/020704.png',
		duration: 30,
	},

	INFUSION_MND: {
		id: 19890,
		name: 'Infusion of Mind',
		icon: 'https://xivapi.com/i/020000/020705.png',
		duration: 30,
	},

	G2_INFUSION_STR: {
		id: 22447,
		name: 'Grade 2 Infusion of Strength',
		icon: 'https://xivapi.com/i/020000/020701.png',
		duration: 30,
	},

	G2_INFUSION_DEX: {
		id: 22448,
		name: 'Grade 2 Infusion of Dexterity',
		icon: 'https://xivapi.com/i/020000/020702.png',
		duration: 30,
	},

	G2_INFUSION_VIT: {
		id: 22449,
		name: 'Grade 2 Infusion of Vitality',
		icon: 'https://xivapi.com/i/020000/020703.png',
		duration: 30,
	},

	G2_INFUSION_INT: {
		id: 22450,
		name: 'Grade 2 Infusion of Intelligence',
		icon: 'https://xivapi.com/i/020000/020704.png',
		duration: 30,
	},

	G2_INFUSION_MND: {
		id: 22451,
		name: 'Grade 2 Infusion of Mind',
		icon: 'https://xivapi.com/i/020000/020705.png',
		duration: 30,
	},

	G3_INFUSION_STR: {
		id: 22451,
		name: 'Grade 3 Infusion of Strength',
		icon: 'https://xivapi.com/i/020000/020701.png',
		duration: 30,
	},

	G3_INFUSION_DEX: {
		id: 24261,
		name: 'Grade 3 Infusion of Dexterity',
		icon: 'https://xivapi.com/i/020000/020702.png',
		duration: 30,
	},

	G3_INFUSION_VIT: {
		id: 24262,
		name: 'Grade 3 Infusion of Vitality',
		icon: 'https://xivapi.com/i/020000/020703.png',
		duration: 30,
	},

	G3_INFUSION_INT: {
		id: 24264,
		name: 'Grade 3 Infusion of Intelligence',
		icon: 'https://xivapi.com/i/020000/020704.png',
		duration: 30,
	},

	G3_INFUSION_MND: {
		id: 24265,
		name: 'Grade 3 Infusion of Mind',
		icon: 'https://xivapi.com/i/020000/020705.png',
		duration: 30,
	},

	SUPER_ETHER: {
		id: 23168 - ITEM_ID_OFFSET, // what is consistency?
		name: 'Super-Ether',
		icon: 'https://xivapi.com/i/020000/020627.png',
	},
})

// Items have an ID 1m higher than the xivapi ID
Object.values(ITEMS).forEach(item => {
	item.id += ITEM_ID_OFFSET
})
export {ITEMS}
