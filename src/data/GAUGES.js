const GAUGES = {
	// ACN
	AETHERFLOW: {
		name: 'Aetherflow',
	},

	// SMN
	AETHERIAL_ATTUNEMENT: {
		name: 'Aetherial Attunement'
	},
	DREADWYRM_AETHER: {
		name: 'Dreadwyrm Aether'
	}
}

const generateIds = (obj) => {
	Object.keys(obj).forEach((key, index) => {
		obj[key].id = index
	})
	return obj
}

export default generateIds(GAUGES)
