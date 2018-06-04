import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import { Item } from 'parser/core/modules/Timeline'

// One of these being applied to an actor signifies they're back up
const RAISE_STATUSES = [
	STATUSES.WEAKNESS.id,
	STATUSES.BRINK_OF_DEATH.id
]

export default class Death extends Module {
	static dependencies = [
		'timeline'
	]

	count = 0
	timestamp = null

	on_death_toPlayer(event) {
		this.count ++
		this.timestamp = event.timestamp
	}

	on_applydebuff_toPlayer(event) {
		// Only care about raises
		if (!RAISE_STATUSES.includes(event.ability.guid)) {
			return
		}

		this.addTimelineDeath(this.timestamp, event.timestamp)
		this.timestamp = null
	}

	on_complete() {
		if (this.timestamp) {
			this.addTimelineDeath(this.timestamp, this.parser.fight.end_time)
		}
	}

	addTimelineDeath(start, end) {
		const startTime = this.parser.fight.start_time
		this.timeline.addItem(new Item({
			type: 'background',
			start: start - startTime,
			end: end - startTime
		}))
	}
}
