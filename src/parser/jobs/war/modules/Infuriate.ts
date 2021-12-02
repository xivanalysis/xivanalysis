import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'

const INFURIATE_REDUCERS: ActionKey[] = [
	'FELL_CLEAVE',
	'DECIMATE',
	'CHAOTIC_CYCLONE',
	'INNER_CHAOS',
]

const INFURIATE_CDR = 5000

export class Infuriate extends Analyser {
	@dependency private cooldowns!: Cooldowns
	@dependency private data!: Data

	override initialise() {
		const reducerIDs = INFURIATE_REDUCERS.map(key => this.data.actions[key].id)

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(oneOf(reducerIDs)),
			() => this.cooldowns.reduce('INFURIATE', INFURIATE_CDR),
		)
	}
}
