import {msg} from '@lingui/core/macro'
import {Trans, Plural} from '@lingui/react/macro'
import {NormalisedMessage} from 'components/ui/NormalisedMessage'
import {Rotation} from 'components/ui/Rotation'
import {Action} from 'data/ACTIONS'
import {iconUrl} from 'data/icon'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CastTime} from 'parser/core/modules/CastTime'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Suggestions, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ReactNode} from 'react'
import {matchClosestLower} from 'utilities'
import {AlwaysBeCasting} from './AlwaysBeCasting'
import {GlobalCooldown} from '../GlobalCooldown'
import {AlwaysBeCastingAnalyser, AlwaysBeCastingIssueInfo} from './AlwaysBeCastingCommon'

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

// used for timeline viewing by giving you a nice 30s window
const TIMELINE_UPPER_MOD: number = 15000

const ICON_WEAVING_ACTION = 1751

export interface Weave {
	leadingGcdEvent: Events['action'],
	trailingGcdEvent: Events['action'],
	gcdTimeDiff: number,
	weaves: Array<Events['action']>,
}

export class Weaving extends AlwaysBeCastingAnalyser {
	static override handle = 'weaving'

	@dependency protected castTime!: CastTime
	@dependency protected data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency protected suggestions!: Suggestions
	@dependency private globalCooldown!: GlobalCooldown

	static override title = msg({id: 'core.weaving.title', message: 'Weaving Issues'})

	protected suggestionIcon: string = iconUrl(ICON_WEAVING_ACTION)

	protected moduleLink = (
		<a style={{cursor: 'pointer'}} onClick={() => this.parser.scrollTo(AlwaysBeCasting.handle)}>
			<Trans id="core.weaving.module-link"><NormalisedMessage message={Weaving.title}/> section of the <NormalisedMessage message={AlwaysBeCasting.title}/></Trans>
		</a>
	)
	protected suggestionContent: ReactNode = <Trans id="core.weaving.content">
		Avoid weaving more actions than you have time for in a single GCD window. Doing so will delay your next GCD, reducing possible uptime. Check the {this.moduleLink} module below for more detailed analysis.
	</Trans>

	protected severity = WEAVING_SEVERITY

	protected ignoredActionIds: number[] = []

	//used to synth a start and end in case there were no actions before the pull or close to when the pull ended. it's also used to ensure that leading and trailing gcd events are not nullable
	private pullStart: Events['action'] = {
		action: 0,
		type: 'action',
		timestamp: this.parser.pull.timestamp,
		source: this.parser.actor.id,
		target: this.parser.actor.id,
	}
	private pullEnd: Events['action'] = {
		action: 0,
		type: 'action',
		timestamp: this.parser.pull.timestamp + this.parser.pull.duration,
		source: this.parser.actor.id,
		target: this.parser.actor.id,
	}

	private weaves: Array<Events['action']> = []
	private ongoingCastEvent?: Events['prepare']
	private leadingGcdEvent: Events['action'] = this.pullStart
	private trailingGcdEvent: Events['action'] = this.pullStart
	public badWeaves: Weave[] = []

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('prepare'), this.onBeginCast)
		this.addEventHook(playerFilter.type('action'), this.onCast)
		this.addEventHook(filter<Event>().type('complete'), this.onComplete)
		this.addEventHook(filter<Event>().type('death').actor(this.parser.actor.id), this.clearWeave)
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

		// Ignore actions we were told to ignore
		if (this.ignoredActionIds.includes(action.id)) {
			return
		}

		// If it's not a GCD, just bump the weave count
		if (this.isOgcd(action)) {
			this.weaves.push(event)
			return
		}

		if (this.ongoingCastEvent && this.ongoingCastEvent.action === action.id && this.ongoingCastEvent.timestamp !== 0) {
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
		// Used to ensure weaves are captured on boss death. Synthed null action used to show
		this.trailingGcdEvent = this.pullEnd

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
			event =>
				!this.invulnerability.isActive({timestamp: event.timestamp, types: ['untargetable']})
				&& event.timestamp >= this.parser.pull.timestamp,
		).length

		const recast = ((weave.leadingGcdEvent != null) ? this.castTime.recastForEvent(weave.leadingGcdEvent) : undefined) ?? this.globalCooldown.getDuration()
		// Check the downtime-adjusted GCD time difference for this weave - do not treat multiple weaves during downtime as bad weaves
		return weave.gcdTimeDiff > recast && weaveCount > this.getMaxWeaves(weave)
	}

	private clearWeave(event: Events['death']) {
		// prompts saving any existing weaves if they're bad, and reset
		if (this.weaves.length > 0) {
			this.saveIfBad()
		}

		// remove existing weaves and pretend the next leadingGcdEvent is like a fresh start (which I guess it is)
		this.weaves = []
		this.leadingGcdEvent = {
			action: 0,
			type: 'action',
			timestamp: event.timestamp,
			source: this.parser.actor.id,
			target: this.parser.actor.id,
		}
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
		const recastTime = this.castTime.recastForEvent(weave.leadingGcdEvent) ?? this.globalCooldown.getDuration()

		return maxWeaves - (recastTime < REDUCE_MAX_WEAVES_RECAST_BELOW ? 1 : 0)
	}

	override get hasIssues() {
		return this.badWeaves.length > 0
	}

	// The amount of time the GCD was delayed by is the invuln-adjusted GCD time difference between the leading/trailing GCDs,
	// less the leading event's expected recast time
	override getDelayPerIssue(weave: Weave) {
		const leadingEventRecastTime = this.castTime.recastForEvent(weave.leadingGcdEvent) ?? this.globalCooldown.getDuration()
		return weave.gcdTimeDiff - leadingEventRecastTime
	}

	override getTotalDelay() {
		return this.badWeaves.reduce((acc, weave) => acc + this.getDelayPerIssue(weave), 0)
	}

	override getIssueData(): AlwaysBeCastingIssueInfo[] {
		return this.badWeaves.map(weave => {
			return {
				timestamp: weave.leadingGcdEvent.timestamp,
				delay: this.getDelayPerIssue(weave),
				start: weave.leadingGcdEvent.timestamp - this.parser.pull.timestamp - TIMELINE_UPPER_MOD,
				stop: weave.trailingGcdEvent.timestamp - this.parser.pull.timestamp + TIMELINE_UPPER_MOD,
				actionsContent: <Rotation events={[
					...(weave.leadingGcdEvent.action !== 0 ? [weave.leadingGcdEvent] : []), // don't want to show null action if individual weaves a lot in the beginning without any beginning actions
					...weave.weaves,
					...(weave.trailingGcdEvent.action !== 0 ? [weave.trailingGcdEvent] : []), // don't want to show null action if individual weaves a lot close to the end without any ending actions
				]}/>,
				infoContent: <><Plural
					id="core.weaving.panel-count"
					value={weave.weaves.length}
					_1="# weave"
					other="# weaves"
				/><br/>
				{this.parser.formatDuration(weave.gcdTimeDiff)}&nbsp;<Trans id="core.weaving.between-gcds">between GCDs</Trans></>,

			}
		})
	}
}
