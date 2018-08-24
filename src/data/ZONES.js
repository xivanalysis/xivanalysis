import {addExtraIndex} from 'utilities'

// TODO: Move banner lookup into an api call w/ server cache?

const ZONES = {
	// 24man
	RABANASTRE: {
		logId: 734,
		dbId: 30058,
		banner: 'https://xivapi.com/i/112000/112256.png',
	},

	RIDORANA_LIGHTHOUSE: {
		logId: 776,
		dbId: 30068,
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
		banner: 'https://xivapi.com/i/000000/000000.png',
	},
}

export default addExtraIndex(ZONES, 'logId')
