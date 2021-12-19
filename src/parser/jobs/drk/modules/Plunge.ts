import {Event, Events} from 'event'
import {ActionKey} from 'data/ACTIONS'
import {isSuccessfulHit} from 'utilities'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'

const PLUNGE_REDUCERS: ActionKey[] = [
	'UNMEND',
]

const PLUNGE_CDR = 5000

export class Plunge extends Analyser {
	static override handle = 'plunge'

	@dependency private cooldowns!: Cooldowns
	@dependency private data!: Data

	override initialise() {
		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('damage').cause(this.data.matchCauseAction(PLUNGE_REDUCERS)), this.onPlungeReducer)
	}

	private onPlungeReducer(event: Events['damage']) {
		if (isSuccessfulHit(event)) {
			this.cooldowns.reduce('PLUNGE', PLUNGE_CDR)
		}
	}
}
