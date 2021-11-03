import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {History} from 'parser/core/modules/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {SwiftcastModule} from 'parser/core/modules/Swiftcast'
import {DWT_CAST_TIME_MOD, DWT_LENGTH} from './DWT'

const MISSED_SEVERITIES = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export default class Swiftcast extends SwiftcastModule {
	static override  handle = 'swiftcast'

	// DWT is being tracked here to avoid having to modify multiple
	// modules that are going to be removed in 6.0 and have no other
	// reason but would need to be converted to Analyser to use their
	// tracking in this class.
	private dwtHistory = new History<number>(() => 0)

	override severityTiers = MISSED_SEVERITIES

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>()
			.source(this.parser.actor.id)
		this.addEventHook(playerFilter
			.action(this.data.actions.DREADWYRM_TRANCE.id)
			.type('action'),
		this.onStartDwt)
		this.addEventHook(playerFilter
			.action(this.data.actions.DEATHFLARE.id)
			.type('action'),
		this.onDeathflare)
	}

	override considerSwiftAction(event: Action) {
		if (this.dwtActiveAt(this.parser.currentEpochTimestamp) &&
			((event.castTime ?? 0) + DWT_CAST_TIME_MOD <= 0)) {
			return false
		}
		return true
	}

	private onStartDwt(event: Events['action']) {
		this.dwtHistory.openNew(event.timestamp)
		this.addTimestampHook(event.timestamp + DWT_LENGTH,
			(endArgs) => this.dwtHistory.closeCurrent(endArgs.timestamp))
	}

	private onDeathflare(event: Events['action']) {
		this.dwtHistory.closeCurrent(event.timestamp)
	}

	private dwtActiveAt(timestamp: number) {
		return this.dwtHistory.entries
			.some(d => d.start <= timestamp &&
			(d.end == null || d.end >= timestamp))
	}
}
