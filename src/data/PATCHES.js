// This is all right from /PatchList - should be easy to sync Eventually™

const PATCHES = {
	// Not going to support pre-4.0 at all
	'4.0': {
		date: 1497517200,
	},
	'4.01': {
		date: 1499162101,
	},
	'4.05': {
		date: 1500368961,
	},
	'4.06': {
		date: 1501747200,
	},
	'4.1': {
		date: 1507622400,
	},
	'4.11': {
		date: 1508839200,
	},
	'4.15': {
		date: 1511258400,
	},
	'4.2': {
		date: 1517227200,
	},
	'4.25': {
		date: 1520935200,
	},
	'4.3': {
		date: 1526976000,
	},
	'4.31': {
		date: 1528223134,
	},
	'4.35': {
		date: 1530617875,
	},
	'4.36': {
		date: 1533635005,
	},
	'4.4': {
		date: 1537268400,
	},
}

export default PATCHES

// This is intentionally in newest->oldest order
const sortedPatches = Object.keys(PATCHES).sort(
	(a, b) => PATCHES[b].date - PATCHES[a].date
)

export const getPatch = (timestamp = (new Date()).getTime()) =>
	sortedPatches.find(key => PATCHES[key].date < timestamp)
