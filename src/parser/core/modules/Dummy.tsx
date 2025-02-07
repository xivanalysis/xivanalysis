import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Event, Events} from 'event'
import {Team} from 'report'
import {Analyser} from '../Analyser'
import {EventHook} from '../Dispatcher'
import {filter, oneOf} from '../filter'
import {dependency} from '../Injectable'
import BrokenLog from './BrokenLog'
import {Death} from './Death'

const LIKELY_DUMMY_THRESHOLD = 3

export class Dummy extends Analyser {
	static override title = t('core.dummy.title')`Striking Dummy`
	static override handle = 'dummy'
	static override debug = false

	@dependency private brokenLog!: BrokenLog
	@dependency private death!: Death

	private hook?: EventHook<Events['death']>

	override initialise() {
		const foeIds = this.parser.pull.actors
			.filter(actor => actor.team === Team.FOE)
			.map(actor => actor.id)

		this.hook = this.addEventHook(
			filter<Event>()
				.type('death')
				.actor(oneOf(foeIds)),
			this.onFoeDeath,
		)
	}

	private onFoeDeath(event: Events['death']) {
		const count = this.death.getCount(event.actor)
		if (count < LIKELY_DUMMY_THRESHOLD) { return }
		if (this.hook != null) { this.removeEventHook(this.hook) }
		this.brokenLog.trigger(this, 'striking dummy', (
			<Trans id="core.dummy.broken-log">
				One or more actors in this pull appear to be striking dummies. The behaviour of dummy health pools breaks a number of assumptions made by xivanalysis, which can lead to subtly incorrect results.
			</Trans>
		), false)
	}
}
