import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const RECAST_TIME = 2000
const SSS_RECAST_TIME = 4000

// TODO:
// Handle end of fight missed cast?
// Handle SSS used before LB?

export abstract class Star extends Analyser {
	static override debug = true
	static override handle = 'star'

	private starCasts: number[] = []

	@dependency data!: Data
	@dependency downtime!: Downtime
	@dependency suggestions!: Suggestions

	override initialise(): void {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.SIX_SIDED_STAR.id),
			this.onCast
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']): void {
		this.starCasts.push(event.timestamp)
	}

	private onComplete(): void {
		const windows = this.downtime.getDowntimeWindows().filter(window => {
			this.debug(`${window.end - window.start}`)
			return (window.end - window.start) > RECAST_TIME
		})

		let windowsMissed = windows.length
		let badCasts = 0

		this.starCasts.forEach(timestamp => {
			const isLastCastBeforeDowntime = this.downtime.isDowntime(timestamp + SSS_RECAST_TIME)
			if (isLastCastBeforeDowntime) {
				windowsMissed--
			} else {
				badCasts++
			}
		})

		this.debug(`Casts: ${this.starCasts.length}, Windows: ${windows.length},`)
		this.debug(`Bad Casts: ${badCasts}, Missed Windows: ${windowsMissed}`)

		if (windowsMissed !== 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.SIX_SIDED_STAR.icon,
				content: <Trans id="mnk.star.missed.content">
					Try to use <ActionLink action="SIX_SIDED_STAR"/> before extended periods of downtime.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="mnk.star.missed.why">
					{windowsMissed} possible <Plural value={windowsMissed} one="cast" other="casts"/> of <ActionLink action="SIX_SIDED_STAR"/> were missed.
				</Trans>,
			}))
		}

		if (badCasts !== 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.SIX_SIDED_STAR.icon,
				content: <Trans id="mnk.star.bad.content">
					Avoid using <ActionLink action="SIX_SIDED_STAR"/> outside of downtime scenarios as it is a potency loss compared to your normal rotation.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="mnk.star.bad.why">
					<Plural value={badCasts} one="# cast" other="# casts"/> of <ActionLink action="SIX_SIDED_STAR"/> used.
				</Trans>,
			}))
		}
	}
}
