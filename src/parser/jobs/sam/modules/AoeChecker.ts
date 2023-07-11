import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {AoEUsages} from 'parser/core/modules/AoEUsages'
//const GAIN_AT_3 = new Set([ACTIONS.FUGA.id, ACTIONS.OKA.id, ACTIONS.MANGETSU.id, ACTIONS.HISSATSU_KYUTEN.id])
//const GAIN_AT_2 = new Set([ACTIONS.HISSATSU_GUREN.id, ACTIONS.TENKA_GOKEN.id, ACTIONS.KAESHI_GOKEN.id])

const AOE_FINISHERS = [
	ACTIONS.MANGETSU.id,
	ACTIONS.OKA.id,
]

export class AoeChecker extends AoEUsages {
	@dependency private actors!: Actors

	suggestionIcon = ACTIONS.FUKO.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.HISSATSU_GUREN,
			stActions: [ACTIONS.HISSATSU_SENEI],
			minTargets: 2,
		},

		{
			aoeAction: ACTIONS.HISSATSU_KYUTEN,
			stActions: [ACTIONS.HISSATSU_SHINTEN],
			minTargets: 3,
		},

		{
			aoeAction: ACTIONS.TENKA_GOKEN,
			stActions: [ACTIONS.MIDARE_SETSUGEKKA],
			minTargets: 2,
		},

		{
			aoeAction: ACTIONS.KAESHI_GOKEN,
			stActions: [ACTIONS.KAESHI_SETSUGEKKA],
			minTargets: 2,
		},

		{
			aoeAction: ACTIONS.FUKO,
			stActions: [ACTIONS.HAKAZE],
			minTargets: 3,

		},

		{
			aoeAction: ACTIONS.OKA,
			stActions: [ACTIONS.KASHA],
			minTargets: 3,
		},

		{
			aoeAction: ACTIONS.MANGETSU,
			stActions: [ACTIONS.GEKKO],
			minTargets: 3,
		},

		{
			aoeAction: ACTIONS.SHOHA_II,
			stActions: [ACTIONS.SHOHA],
			minTargets: 3,
		},
	]

	protected override adjustMinTargets(event: Events['damage'], minTargets: number): number {
		if (event.cause.type !== 'action') {
			return minTargets
		}

		if (AOE_FINISHERS.includes(event.cause.action) && !(this.actors.current.hasStatus(STATUSES.MEIKYO_SHISUI.id))) {
			return 1
		}

		return minTargets
	}
}

