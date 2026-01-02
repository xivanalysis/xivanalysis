import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {Rotation} from 'components/ui/Rotation'
import {ACTIONS} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Suggestions, SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {AlwaysBeCastingAnalyser, AlwaysBeCastingIssueInfo} from './AlwaysBeCastingCommon'
import {filter} from '../../filter'
import {dependency} from '../../Injectable'
import {CastTime} from '../CastTime'
import {Data} from '../Data'

interface SeverityTiers {
	[key: number]: number
}

// used for timeline viewing by giving you a nice 30s window
const TIMELINE_UPPER_MOD: number = 15000

interface InterruptInfo {
	event: Events['interrupt'],
	missedTimeMS: number
	leadingEvent: Events['prepare']
}

export class Interrupts extends AlwaysBeCastingAnalyser {
	static override handle: string = 'interrupts'
	static override title: MessageDescriptor = msg({id: 'core.interrupts.title', message: 'Interrupted Casts'})
	static override debug: boolean = false

	@dependency private castTime!: CastTime
	@dependency protected data!: Data
	@dependency private suggestions!: Suggestions

	private currentCast?: Events['prepare']
	private droppedCasts: InterruptInfo[] = []
	private missedTimeMS: number = 0

	/**
	 * Implementing modules MAY override the icon to be used for the suggestion,
	 * though, let's face it – interject is pretty much the perfect one.
	 */
	protected icon: string = ACTIONS.INTERJECT.icon

	/**
	 * Implementing modules MAY override the severity tiers for interrupted casts
	 */
	protected severity: SeverityTiers = {
		2: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	}

	/**
	 * Implementing modules MAY override the default suggestion text
	 */
	protected suggestionContent: JSX.Element = <Trans id="core.interrupts.suggestion.content">
		Avoid interrupting casts by either prepositioning yourself or utilizing slidecasting where possible. If you have to move, try to save an instant cast to keep your GCD rolling.
	</Trans>

	/**
	 * Implementing modules MAY override this function to provide specific text if they wish for the 'why'
	 * The default is to complain that they missed a number of casts and give them an estimate
	 * @param missedCasts The array of missed casts
	 * @param missedTime The approximate time wasted via interrupts
	 * @returns JSX that conforms to your suggestion content
	 */
	protected suggestionWhy(missedCasts: InterruptInfo[], missedTime: number): JSX.Element {
		return <Trans id="core.interrupts.suggestion.why">You missed { missedCasts.length } casts (approximately { this.parser.formatDuration(missedTime) } of total casting time) due to interruption.</Trans>
	}

	/**
	 * Implementing modules MAY override this function to provide alternative output if there's 0 interrupted
	 * casts (in lieu of an empty table)
	 */
	protected noInterruptsOutput(): JSX.Element | undefined {
		return undefined
	}

	public override initialise() {
		this.addEventHook(
			filter<Event>()
				.type('prepare')
				.source(this.parser.actor.id),
			this.onBeginCast
		)
		this.addEventHook(
			filter<Event>()
				.type('interrupt')
				.source(this.parser.actor.id),
			this.pushDropCasts
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onBeginCast(event: Events['prepare']) {
		this.currentCast = event
	}

	private pushDropCasts(event: Events['interrupt']) {
		if (this.currentCast == null) { return }

		const castTime = this.castTime.forAction(this.currentCast.action, this.currentCast.timestamp) ?? 0

		const missedTimeMS = Math.min(
			event.timestamp - (this.currentCast.timestamp ?? this.parser.currentEpochTimestamp),
			castTime
		)
		this.missedTimeMS += missedTimeMS
		this.droppedCasts.push({
			event,
			missedTimeMS,
			leadingEvent: this.currentCast,
		})
		this.currentCast = undefined
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.icon,
			tiers: this.severity,
			value: this.droppedCasts.length,
			content: this.suggestionContent,
			why: this.suggestionWhy(this.droppedCasts, this.missedTimeMS),
		}))
	}

	override get hasIssues() {
		return this.droppedCasts.length > 0
	}

	override getDelayPerIssue(interrupt:  InterruptInfo) {
		return interrupt.missedTimeMS
	}

	override getTotalDelay() {
		return this.droppedCasts.reduce((acc, interrupt) => acc + this.getDelayPerIssue(interrupt), 0)
	}

	override getIssueData(): AlwaysBeCastingIssueInfo[] {
		return this.droppedCasts.map(cast => {
			return {
				timestamp: cast.event.timestamp,
				delay: cast.missedTimeMS,
				start: cast.event.timestamp - this.parser.pull.timestamp - TIMELINE_UPPER_MOD,
				stop: cast.event.timestamp - this.parser.pull.timestamp + TIMELINE_UPPER_MOD,
				actionsContent: <Rotation events={[cast.event]} />,
				infoContent: undefined,
			}
		})
	}
}
