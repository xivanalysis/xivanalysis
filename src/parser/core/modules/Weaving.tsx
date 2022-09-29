import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import Rotation from 'components/ui/Rotation'
import {Action} from 'data/ACTIONS'
import {BASE_GCD} from 'data/CONSTANTS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {ReactNode} from 'react'
import {Accordion} from 'semantic-ui-react'
import {matchClosestLower} from 'utilities'

const CAST_TIME_MAX_WEAVES = {
	0: 2,
	1000: 1,
	2500: 0,
}
const REDUCE_MAX_WEAVES_RECAST_BELOW = 1800
const DEFAULT_MAX_WEAVES = 2

const WEAVING_SEVERITY = {
	1: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export interface Weave {
	leadingGcdEvent?: Events['action'],
	trailingGcdEvent: Events['action'],
	gcdTimeDiff: number,
	weaves: Array<Events['action']>,
}

export class Weaving extends Analyser {
	static override handle = 'weaving'

	@dependency protected castTime!: CastTime
	@dependency protected data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private suggestions!: Suggestions

	static override title = t('core.weaving.title')`Weaving Issues`

	protected suggestionIcon: string = 'https://xivapi.com/i/001000/001785.png' // WVR Focused Synth

	protected moduleLink = (
		<a style={{cursor: 'pointer'}} onClick={() => this.parser.scrollTo(Weaving.handle)}>
			<NormalisedMessage message={Weaving.title}/>
		</a>
	)
	protected suggestionContent: ReactNode = <Trans id="core.weaving.content">
		Avoid weaving more actions than you have time for in a single GCD window. Doing so will delay your next GCD, reducing possible uptime. Check the {this.moduleLink} module below for more detailed analysis.
	</Trans>

	protected severity = WEAVING_SEVERITY

	private weaves: Array<Events['action']> = []
	private ongoingCastEvent?: Events['prepare']
	private leadingGcdEvent?: Events['action']
	private trailingGcdEvent?: Events['action']
	private badWeaves: Weave[] = []

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('prepare'), this.onBeginCast)
		this.addEventHook(playerFilter.type('action'), this.onCast)
		this.addEventHook(filter<Event>().type('complete'), this.onComplete)
		this.addEventHook(filter<Event>().type('death'), this.clearWeave)
	}

	private onBeginCast(event: Events['prepare']) {
		this.ongoingCastEvent = event
	}

	private onCast(event: Events['action']) {
		const action = this.data.getAction(event.action)

		// If the action is an auto, just ignore it
		if (!action || action.autoAttack) {
			return
		}

		// If it's not a GCD, just bump the weave count
		if (this.isOgcd(action)) {
			this.weaves.push(event)
			return
		}

		if (this.ongoingCastEvent && this.ongoingCastEvent.action === action.id) {
			// This event is the end of a GCD cast
			this.trailingGcdEvent = {
				...event,
				// Override the timestamp of the GCD with when its cast began
				timestamp: this.ongoingCastEvent.timestamp,
			}
		} else {
			// This event was an instant GCD (or log missed the cast starting)
			this.trailingGcdEvent = event
		}

		// Always reset the ongoing cast
		this.ongoingCastEvent = undefined

		// Throw the current state onto the history
		this.saveIfBad()

		// Reset
		this.leadingGcdEvent = this.trailingGcdEvent
		this.weaves = []
	}

	private onComplete() {
		// If there's been at least one gcd, run a cleanup on any remnant data
		if (this.leadingGcdEvent) {
			this.saveIfBad()
		}

		// Few triples is medium, any more is major
		this.suggestions.add(new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			why: <Plural
				id="core.weaving.why"
				value={this.badWeaves.length}
				_1="# instance of incorrect weaving"
				other="# instances of incorrect weaving"
			/>,
			tiers: this.severity,
			value: this.badWeaves.length,
		}))
	}

	private saveIfBad() {
		if (this.trailingGcdEvent == null) { return }

		const leadingTimestamp = this.leadingGcdEvent?.timestamp ?? this.parser.pull.timestamp
		const gcdTimeDiff = this.trailingGcdEvent.timestamp
			- leadingTimestamp
			- this.invulnerability.getDuration({
				start: leadingTimestamp,
				end: this.trailingGcdEvent.timestamp,
			})

		const weave: Weave = {
			leadingGcdEvent: this.leadingGcdEvent,
			trailingGcdEvent: this.trailingGcdEvent,
			gcdTimeDiff,
			weaves: this.weaves,
		}

		if (weave.weaves.length === 0) {
			return
		}

		if (this.isBadWeave(weave)) {
			this.badWeaves.push(weave)
		}
	}

	private isOgcd(action: Action) {
		return !action.onGcd && !action.autoAttack
	}

	private isBadWeave(weave: Weave) {
		// Calc. the no. of weaves - we're ignoring any made while the boss is untargetable, and events that happened before the pull
		const weaveCount = weave.weaves.filter(
			event => true
				&& !this.invulnerability.isActive({timestamp: event.timestamp, types: ['untargetable']})
				&& event.timestamp >= this.parser.pull.timestamp,
		).length

		const recast = ((weave.leadingGcdEvent != null) ? this.castTime.recastForEvent(weave.leadingGcdEvent) : undefined) ?? BASE_GCD
		// Check the downtime-adjusted GCD time difference for this weave - do not treat multiple weaves during downtime as bad weaves
		return weave.gcdTimeDiff > recast && weaveCount > this.getMaxWeaves(weave)
	}

	private clearWeave() {
		// prompts saving any existing weaves if they're bad, and reset
		if (this.weaves.length > 0) {
			this.saveIfBad()
		}

		// remove existing weaves and pretend the next leadingGcdEvent is like a fresh start (which I guess it is)
		this.weaves = []
		this.leadingGcdEvent = undefined
	}

	/**
	 * Implementing classes MAY override this in order to provide custom logic for determining the number of max weaves, given the leading GCD Event
	 * @param event The Action Event of the leading GCD.  Will be undefined for the first GCD of the pull - default behavior is to allow 2 weaves in case of missing pre-pull action
	 * @returns number of allowed weaves after the leading GCD before flagging as bad weaving
	 */
	protected getMaxWeaves(weave: Weave): number {
		if (weave.leadingGcdEvent == null) {
			return DEFAULT_MAX_WEAVES
		}

		const castTime = this.castTime.forEvent(weave.leadingGcdEvent)
		if (castTime == null)  {
			return DEFAULT_MAX_WEAVES
		}

		const maxWeaves = matchClosestLower(CAST_TIME_MAX_WEAVES, castTime) ?? DEFAULT_MAX_WEAVES
		const recastTime = this.castTime.recastForEvent(weave.leadingGcdEvent) ?? BASE_GCD

		return maxWeaves - (recastTime < REDUCE_MAX_WEAVES_RECAST_BELOW ? 1 : 0)
	}

	override output() {
		if (this.badWeaves.length === 0) {
			return false
		}

		const panels = this.badWeaves.map(item => ({
			key: item.leadingGcdEvent?.timestamp ?? this.parser.pull.timestamp,
			title: {
				content: <>
					<strong>{this.parser.formatEpochTimestamp(item.leadingGcdEvent?.timestamp ?? this.parser.pull.timestamp)}</strong>
					&nbsp;-&nbsp;
					<Plural
						id="core.weaving.panel-count"
						value={item.weaves.length}
						_1="# weave"
						other="# weaves"
					/>
					&nbsp;(
					{this.parser.formatDuration(item.gcdTimeDiff)}
					&nbsp;
					<Trans id="core.weaving.between-gcds">between GCDs</Trans>
					)
				</>,
			},
			content: {
				content: <Rotation events={[
					...(item.leadingGcdEvent != null ? [item.leadingGcdEvent] : []),
					...item.weaves,
				]}/>,
			},
		}))

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}
