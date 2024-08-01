import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const RDM = ensureStatuses({
	DUALCAST: {
		id: 1249,
		name: 'Dualcast',
		icon: iconUrl(13406),
		duration: 15000,
	},
	VERSTONE_READY: {
		id: 1235,
		name: 'Verstone Ready',
		icon: iconUrl(13403),
		duration: 30000,
	},
	VERFIRE_READY: {
		id: 1234,
		name: 'Verfire Ready',
		icon: iconUrl(13402),
		duration: 30000,
	},
	ACCELERATION: {
		id: 1238,
		name: 'Acceleration',
		icon: iconUrl(13405),
		duration: 20000,
	},
	EMBOLDEN_PARTY: {
		// Note that this is the Embolden that other people receive from RDM
		id: 1297,
		name: 'Embolden',
		icon: iconUrl(18941),
		duration: 20000,
	},
	EMBOLDEN_SELF: {
		// Note that this is the Embolden that the RDM casting receives
		id: 1239,
		name: 'Embolden',
		icon: iconUrl(18921),
		duration: 20000,
	},
	MANAFICATION: {
		id: 1971,
		name: 'Manafication',
		icon: iconUrl(17491),
		duration: 15000,
		stacksApplied: 6,
	},
	MAGICK_BARRIER: {
		id: 2707,
		name: 'Magick Barrier',
		icon: iconUrl(13408),
		duration: 10000,
	},
	THORNED_FLOURISH: {
		id: 3876,
		name: 'Thorned Flourish',
		icon: iconUrl(13411),
		duration: 30000,
	},
	GRAND_IMPACT_READY: {
		id: 3877,
		name: 'Grand Impact Ready',
		icon: iconUrl(13412),
		duration: 30000,
	},
	PREFULGENCE_READY: {
		id: 3878,
		name: 'Prefulgence Ready',
		icon: iconUrl(13413),
		duration: 30000,
	},
	MAGICKED_SWORDPLAY: {
		id: 3875,
		name: 'Magicked Swordplay',
		icon: iconUrl(18665),
		duration: 15000,
		stacksApplied: 3,
	},
})
