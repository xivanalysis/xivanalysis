import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {AoEUsages} from 'parser/core/modules/AoEUsages'
//const GAIN_AT_3 = new Set([ACTIONS.FUGA.id, ACTIONS.OKA.id, ACTIONS.MANGETSU.id, ACTIONS.HISSATSU_KYUTEN.id])
//const GAIN_AT_2 = new Set([ACTIONS.HISSATSU_GUREN.id, ACTIONS.TENKA_GOKEN.id, ACTIONS.KAESHI_GOKEN.id])

export default class AoeChecker extends AoEUsages {
	static dependencies = [
		...AoEUsages.dependencies,
		'combatants',
	]
	suggestionIcon = ACTIONS.FUGA.icon

	trackedAbilities = [
		{
			AoEAction: ACTIONS.HISSATSU_GUREN,
			stActions: [ACTIONS.HISSATSU_SENEI],
			minTargets: 2,
		},

		{
			AoEAction: ACTIONS.HISSATSU_KYUTEN,
			stActions: [ACTIONS.HISSATSU_SHINTEN],
			minTargets: 3,
		},

		{
			AoEAction: ACTIONS.TENKA_GOKEN,
			stActions: [ACTIONS.MIDARE_SETSUGEKKA],
			minTargets: 2,
		},

		{
			AoEAction: ACTIONS.KAESHI_GOKEN,
			stActions: [ACTIONS.KAESHI_SETSUGEKKA],
			minTargets: 2,
		},

		{
			AoEAction: ACTIONS.FUGA,
			stActions: [ACTIONS.HAKAZE],
			minTargets: 3,

		},

		{
			AoEAction: ACTIONS.OKA,
			stActions: [ACTIONS.KASHA],
			minTargets: 3,

		},

		{
			AoEAction: ACTIONS.MANGETSU,
			stActions: [ACTIONS.GEKKO],
			minTargets: 3,

		},
	]

	adjustMinTargets(event, minTargets) {
		if (event.ability.guid === (ACTIONS.MANGETSU.id || ACTIONS.OKA.id) && !(this.combatants.selected.hasStatus(STATUSES.MEIKYO_SHISUI.id))) {
			return 1
		}
		return minTargets
	}
}

