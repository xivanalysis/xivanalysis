import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch620: Layer<ActionRoot> = {
	patch: '6.2',
	data: {
		//GNB - Bloodfest alignment change.
		BLOODFEST: {cooldown: 120000},
		// SGE - New shield status for Holos
		HOLOS: {statusesApplied: ['HOLOS', 'HOLOSAKOS']},

		// WAR potency bumps
		MAIM: {potency: 150, combo: {from: 31, potency: 300}},
		STORMS_EYE: {potency: 130, combo: {from: 37, potency: 410, end: true}},
		STORMS_PATH: {potency: 130, combo: {from: 37, potency: 410, end: true}},
	},
}
