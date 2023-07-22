import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

//assumptions listed after each severity
const SEVERITIES = {
	USE_PERCENT_THRESHOLD: {
		0.8: SEVERITY.MAJOR, //less than 20% of the available time is close to not using it at all or barely
		0.4: SEVERITY.MEDIUM, //60% is not using it enough -- risks not having enough mana throughout the fight, but with cards, this may not be as applicable
		0.2: SEVERITY.MINOR, //80% of the time is used to keep it on the radar, but not punish
	},
}

export class LucidDreaming extends Analyser {
	static override handle = 'lucid'
	static override dependencies = [
		'suggestions',
	]

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private lastUse = 0
	private uses = 0
	private totalHeld = 0

	override initialise() {

		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.LUCID_DREAMING.id), this.onCastLucid)
		this.addEventHook('complete', this.onComplete)
	}

	private onCastLucid(event: Events['action']) {
		this.uses++

		if (this.lastUse === 0) { this.lastUse = this.parser.pull.timestamp }

		let _held = 0

		if (this.uses === 1) {
			// The first use, take holding as from the first minute of the fight
			_held = event.timestamp - this.parser.pull.timestamp
		} else {
			// Take holding as from the time it comes off cooldown
			_held = event.timestamp - this.lastUse - this.data.actions.LUCID_DREAMING.cooldown
		}

		if (_held > 0) {
			this.totalHeld += _held
		}
		//update the last use
		this.lastUse = event.timestamp
	}

	protected suggestionContent: JSX.Element = <Fragment>
		<Trans id="core.lucid-dreaming.suggestion.content">
			Try to keep <DataLink action="LUCID_DREAMING" /> on cooldown for better MP management.
		</Trans>
	</Fragment>

	protected suggestionWhy(usesMissed: number, holdDuration: number): JSX.Element {
		return <Fragment>
			<Trans id="core.lucid-dreaming.suggestion.why">
				<Plural value={usesMissed} one="# use" other="# uses" /> of Lucid Dreaming <Plural value={usesMissed} one="was" other="were" /> missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
			</Trans>
		</Fragment>
	}

	private onComplete() {
		//uses missed reported in 1 decimal
		const holdDuration = this.uses === 0 ? this.parser.pull.duration : this.totalHeld
		const usesMissed = Math.floor(holdDuration / this.data.actions.LUCID_DREAMING.cooldown)
		const notUsesPercent = usesMissed === 0 ? 0 : holdDuration/this.parser.pull.duration

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.LUCID_DREAMING.icon,
			content: this.suggestionContent,
			tiers: SEVERITIES.USE_PERCENT_THRESHOLD,
			why: this.suggestionWhy(usesMissed, holdDuration),
			value: notUsesPercent,
		}))
	}
}
