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
			aoeAbility: ACTIONS.HISSATSU_GUREN,
			stAbilities: [ACTIONS.HISSATSU_SENEI],
			minTargets: 2,
		},

		{
			aoeAbility: ACTIONS.HISSATSU_KYUTEN,
			stAbilities: [ACTIONS.HISSATSU_SHINTEN],
			minTargets: 3,
		},

		{
			aoeAbility: ACTIONS.TENKA_GOKEN,
			stAbilities: [ACTIONS.MIDARE_SETSUGEKKA],
			minTargets: 2,
		},

		{
			aoeAbility: ACTIONS.KAESHI_GOKEN,
			stAbilities: [ACTIONS.KAESHI_SETSUGEKKA],
			minTargets: 2,
		},

		{
			aoeAbility: ACTIONS.FUGA,
			stAbilities: [ACTIONS.HAKAZE],
			minTargets: 3,

		},

		{
			aoeAbility: ACTIONS.OKA,
			stAbilities: [ACTIONS.KASHA],
			minTargets: 3,

		},

		{
			aoeAbility: ACTIONS.MANGETSU,
			stAbilities: [ACTIONS.GEKKO],
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

