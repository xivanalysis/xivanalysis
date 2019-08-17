import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {dependency} from 'parser/core/Module'
import {AoeEvent} from 'parser/core/modules/AoE'
import Combatants from 'parser/core/modules/Combatants'
import CoreCombos from 'parser/core/modules/Combos'
import DirtyDancing from './DirtyDancing'

const GCD_TIMEOUT_MILLIS = 15000

export default class Combos extends CoreCombos {
	// Override statics
	static suggestionIcon = ACTIONS.CASCADE.icon

	@dependency private dancing!: DirtyDancing
	@dependency private combatants!: Combatants

	// Override check for allowable breaks. If two dances were started during the initial context's GCD timeout window,
	// (ie, both Standard and Technical were danced), then we'll allow it
	isAllowableComboBreak(event: AoeEvent, context: AoeEvent[]): boolean {
		// Shouldn't ever be the case, but protect against weird shit
		if (context.length !== 1) {
			return false
		}
		// Technical windows could also go Tech -> Saber -> Fountainfall -> Saber -> Standard -> Fountain drops,
		// so just disable any drops that happened in a Technical window (still need the dances in range check since
		// Cascade -> Standard -> Technical leaves the buff falling off before Technical Finish buff applies
		return this.dancing.dancesInRange(context[0].timestamp, context[0].timestamp + GCD_TIMEOUT_MILLIS) === 2 ||
			this.combatants.selected.hasStatus(STATUSES.TECHNICAL_FINISH.id, event.timestamp)
	}
}
