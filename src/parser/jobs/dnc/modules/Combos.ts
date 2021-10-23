import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Events} from 'event'
import {dependency} from 'parser/core/Module'
import {Actors} from 'parser/core/modules/Actors'
import {Combos as CoreCombos} from 'parser/core/modules/Combos'
import {DirtyDancing} from './DirtyDancing'

const GCD_TIMEOUT_MILLIS = 15000

export class Combos extends CoreCombos {
	override suggestionIcon = ACTIONS.CASCADE.icon

	@dependency private dancing!: DirtyDancing
	@dependency private actors!: Actors

	// Override check for allowable breaks. If two dances were started during the initial context's GCD timeout window,
	// (ie, both Standard and Technical were danced), then we'll allow it
	override isAllowableComboBreak(event: Events['damage'], context: Array<Events['damage']>): boolean {
		// Shouldn't ever be the case, but protect against weird shit
		if (context.length !== 1) {
			return false
		}

		// If you broke the combo by restarting it when you still had one open, cut it out
		if (event.timestamp < context[0].timestamp + GCD_TIMEOUT_MILLIS) {
			return false
		}

		// Technical windows could also go Tech -> Saber -> Fountainfall -> Saber -> Standard -> Fountain drops,
		// so just disable any drops that happened in a Technical window (still need the dances in range check since
		// Cascade -> Standard -> Technical leaves the buff falling off before Technical Finish buff applies
		return this.dancing.dancesInRange(this.parser.fflogsToEpoch(context[0].timestamp), this.parser.fflogsToEpoch(context[0].timestamp + GCD_TIMEOUT_MILLIS)) === 2 ||
			this.actors.current.at(this.parser.fflogsToEpoch(context[0].timestamp + GCD_TIMEOUT_MILLIS)).hasStatus(STATUSES.TECHNICAL_FINISH.id)
	}
}
