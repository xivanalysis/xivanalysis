import {addExtraIndex} from 'utilities'

// TODO: Move banner lookup into an api call w/ server cache?

const ZONES = {
	// Special case "Trash" zone so we can display trash
	_TRASH: {
		logId: NaN,
		dbId: NaN,
		banner: '',
	},

	// 24man
	RABANASTRE: {
		logId: 734,
		dbId: 30058,
		banner: 'https://xivapi.com/i/112000/112256.png',
	},

	RIDORANA_LIGHTHOUSE: {
		logId: 776,
		dbId: 30068,
		banner: 'https://xivapi.com/i/112000/112286.png',
	},

	ORBONNE_MONASTARY: {
		// logId: TODO,
		dbId: 30077,
		banner: 'https://xivapi.com/i/112000/112334.png',
	},

	// Primal EX
	SUSANO_EX: {
		logId: 677,
		dbId: 20047,
		banner: 'https://xivapi.com/i/112000/112245.png',
	},

	LAKSHMI_EX: {
		logId: 720,
		dbId: 20049,
		banner: 'https://xivapi.com/i/112000/112246.png',
	},

	SHINRYU_EX: {
		logId: 730,
		dbId: 20050,
		banner: 'https://xivapi.com/i/112000/112258.png',
	},

	BYAKKO_EX: {
		logId: 758,
		dbId: 20052,
		banner: 'https://xivapi.com/i/112000/112274.png',
	},

	TSUKUYOMI_EX: {
		logId: 779,
		dbId: 20055,
		banner: 'https://xivapi.com/i/112000/112291.png',
	},

	SUZAKU_EX: {
		logId: 811,
		dbId: 20058,
		banner: 'https://xivapi.com/i/112000/112322.png',
	},

	SEIRYU_EX: {
		// logId: TODO,
		dbId: 20061,
		banner: 'https://xivapi.com/i/112000/112340.png',
	},

	// Omega Savage
	// O1-4S seem to all be zoneId 17 for w/e reason
	O1S: {
		dbId: 30053,
		banner: 'https://xivapi.com/i/112000/112238.png',
	},

	O2S: {
		dbId: 30054,
		banner: 'https://xivapi.com/i/112000/112239.png',
	},

	O3S: {
		dbId: 30055,
		banner: 'https://xivapi.com/i/112000/112240.png',
	},

	O4S: {
		dbId: 30056,
		banner: 'https://xivapi.com/i/112000/112241.png',
	},

	O5S: {
		logId: 752,
		dbId: 30063,
		banner: 'https://xivapi.com/i/112000/112266.png',
	},

	O6S: {
		logId: 753,
		dbId: 30064,
		banner: 'https://xivapi.com/i/112000/112268.png',
	},

	O7S: {
		logId: 754,
		dbId: 30065,
		banner: 'https://xivapi.com/i/112000/112270.png',
	},

	O8S: {
		logId: 755,
		dbId: 30066,
		banner: 'https://xivapi.com/i/112000/112272.png',
	},

	O9S: {
		logId: 802,
		dbId: 30073,
		banner: 'https://xivapi.com/i/112000/112316.png',
	},

	O10S: {
		logId: 803,
		dbId: 30074,
		banner: 'https://xivapi.com/i/112000/112317.png',
	},

	O11S: {
		logId: 804,
		dbId: 30075,
		banner: 'https://xivapi.com/i/112000/112318.png',
	},

	O12S: {
		logId: 805,
		dbId: 30076,
		banner: 'https://xivapi.com/i/112000/112319.png',
	},

	// Ultimate
	UCOB: {
		logId: 733,
		dbId: 30057,
		banner: 'https://xivapi.com/i/112000/112261.png',
	},

	// UwU
	UWU: {
		logId: 777,
		dbId: 30067,
		banner: 'https://xivapi.com/i/112000/112296.png',
	},
}

export default addExtraIndex(ZONES, 'logId')
