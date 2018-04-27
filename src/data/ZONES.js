import { addExtraIndex } from 'utilities'

// TODO: Move banner lookup into an api call w/ server cache?

const ZONES = {
	O5S: {
		logId: 752,
		dbId: 30063,
		banner: 'https://secure.xivdb.com/img/game/112000/112266.png'
	},

	O6S: {
		logId: 753,
		dbId: 30064,
		banner: 'https://secure.xivdb.com/img/game/112000/112268.png'
	},

	O7S: {
		logId: 754,
		dbId: 30065,
		banner: 'https://secure.xivdb.com/img/game/112000/112270.png'
	},

	O8S: {
		logId: 755,
		dbId: 30066,
		banner: 'https://secure.xivdb.com/img/game/112000/112272.png'
	}
}

export default addExtraIndex(ZONES, 'logId')
