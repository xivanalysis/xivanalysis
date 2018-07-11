// Items need to be cast, so they appear (and are used as) actions
// TODO: Should I keep items in a seperate data/ import and just translate to actions here, or keep as-is?

const ITEMS = {
	INFUSION_STR: {
		id: 19886,
		name: "Infusion of Strength",
		icon: "https://secure.xivdb.com/img/game_local/1/19886.jpg",
	},

	INFUSION_DEX: {
		id: 19887,
		name: "Infusion of Dexterity",
		icon: "https://secure.xivdb.com/img/game_local/1/19887.jpg",
	},

	INFUSION_VIT: {
		id: 19888,
		name: "Infusion of Vitality",
		icon: "https://secure.xivdb.com/img/game_local/1/19888.jpg",
	},

	INFUSION_INT: {
		id: 19889,
		name: "Infusion of Intelligence",
		icon: "https://secure.xivdb.com/img/game_local/1/19889.jpg",
	},

	INFUSION_MND: {
		id: 19890,
		name: "Infusion of Mind",
		icon: "https://secure.xivdb.com/img/game_local/1/19890.jpg",
	},

	G2_INFUSION_STR: {
		id: 22447,
		name: "Grade 2 Infusion of Strength",
		icon: "https://secure.xivdb.com/img/game_local/2/22447.jpg",
	},

	G2_INFUSION_DEX: {
		id: 22448,
		name: "Grade 2 Infusion of Dexterity",
		icon: "https://secure.xivdb.com/img/game_local/2/22448.jpg",
	},

	G2_INFUSION_VIT: {
		id: 22449,
		name: "Grade 2 Infusion of Vitality",
		icon: "https://secure.xivdb.com/img/game_local/2/22449.jpg",
	},

	G2_INFUSION_INT: {
		id: 22450,
		name: "Grade 2 Infusion of Intelligence",
		icon: "https://secure.xivdb.com/img/game_local/2/22450.jpg",
	},

	G2_INFUSION_MND: {
		id: 22451,
		name: "Grade 2 Infusion of Mind",
		icon: "https://secure.xivdb.com/img/game_local/2/22451.jpg",
	},
};

// Items have an ID 1m higher than the xivdb ID
Object.values(ITEMS).forEach(item => {
	item.id += 1000000;
});
export default ITEMS
