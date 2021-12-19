import {Event} from 'event'
import {ActionKey} from 'data/ACTIONS'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
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
		const reducerIDs = PLUNGE_REDUCERS.map(key => this.data.actions[key].id)
		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action').action(oneOf(reducerIDs)), () => this.cooldowns.reduce('PLUNGE', PLUNGE_CDR))
	}
}
