import {ACTIONS} from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

// Drill's potency was boosted from 600p to 620p in 7.3, so it now takes three targets for Bioblaster to pull ahead
const BIO_BEFORE_73 = 2
const BIO_AFTER_73 = 3

export class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.SPREAD_SHOT.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.BIOBLASTER,
			stActions: [ACTIONS.DRILL],
			minTargets: this.parser.patch.before('7.3') ? BIO_BEFORE_73 : BIO_AFTER_73,
		}, {
			aoeAction: ACTIONS.AUTO_CROSSBOW,
			stActions: [ACTIONS.BLAZING_SHOT],
			minTargets: 4,
		}, {
			aoeAction: ACTIONS.SCATTERGUN,
			stActions: [ACTIONS.HEATED_SPLIT_SHOT],
			minTargets: 4,
		},
	]
}
