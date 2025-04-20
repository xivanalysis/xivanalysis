import {Plural, t, Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow} from 'parser/core/modules/ActionWindow'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {Actors} from 'parser/core/modules/Actors'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Icon, Message} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {Gauge} from './Gauge'
import {InstantCastUsageEvaluator} from './InstantCastEvaluators/InstantCastUsageEvaluator'
import {Procs} from './Procs'

export class Triplecast extends BuffWindow {
	static override handle = 'triplecast'
	static override title = t('blm.triplecast.title')`Triplecast Actions`
	static override displayOrder: number = DISPLAY_ORDER.TRIPLECAST

	@dependency private actors!: Actors
	@dependency private gauge!: Gauge
	@dependency private procs!: Procs

	override buffStatus: Status = this.data.statuses.TRIPLECAST
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	protected override prependMessages?: JSX.Element | undefined = <Message icon>
		<Icon name="info" />
		<Message.Content>
			<Trans id="blm.triplecast.header.message">
				<DataLink action="TRIPLECAST" /> is your primary cooldown for resolving extended movement.<br/>
				Once you've learned where it's needed to handle mechanics, you can also use it for a damage increase, similar to <DataLink showIcon={false} action="SWIFTCAST" />.
			</Trans>
		</Message.Content>
	</Message>

	private overwrittenTriples = 0

	override initialise() {
		super.initialise()

		const actionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
		this.setEventFilter((event): event is Events['action'] => {
			if (!actionFilter(event)) { return false }

			const actionData = getDataBy(this.data.actions, "id", event.action)
			if (actionData == null) { return false }

			// If it's not a GCD, it's not affected by Triplecast
			if (!actionData.onGcd) { return false }
			// If it's already instant, it's not affected by Triplcast
			if (actionData.castTime === 0) { return false }
			// Firestarters are made instant by the proc, so don't consume Triplecast
			if (actionData.id === this.data.actions.FIRE_III.id && this.procs.checkEventWasProc(event)) { return false }
			// Swiftcast takes priority over Triplecast
			if (this.actors.current.hasStatus(this.data.statuses.SWIFTCAST.id)) { return false }

			return true
		})

		if (!this.parser.patch.before('7.2')) {
			this.addEvaluator(new InstantCastUsageEvaluator({
				blizzard3Id: this.data.actions.BLIZZARD_III.id,
				gauge: this.gauge,
			}))
		}

		this.addEventHook(filter<Event>().source(this.parser.actor.id).action(this.data.actions.TRIPLECAST.id), this.onTriplecast)
		this.addEventHook('complete', this.onComplete)
	}

	private onTriplecast() {
		if (this.actors.current.hasStatus(this.data.statuses.TRIPLECAST.id)) {
			this.overwrittenTriples++
		}
	}

	override onComplete() {
		super.onComplete()

		// Suggestion not to overwrite Triplecast
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TRIPLECAST.icon,
			content: <Trans id="blm.triplecast.suggestions.overwrote-triplecasts.content">
				You lost at least one instant cast spell by using <DataLink action="TRIPLECAST" /> while the status was already active.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this.overwrittenTriples,
			why: <Trans id="blm.triplecast.suggestions.overwrote-triplecasts.why">
				You overwrote <DataLink showIcon={false} status="TRIPLECAST" /> <Plural value={this.overwrittenTriples} one="# time" other="# times" />.
			</Trans>,
		}))
	}

	// Stupid shim to work around an ACT/fflogs event ordering glitch where Thunderhead applications due to AF/UI element changes
	// cause the Swiftcast status remove event to come before the action event, which is opposite the normal ordering
	protected override onStatusRemove(event: Events['statusRemove']): void {
		this.addTimestampHook(event.timestamp + 1, () => super.onStatusRemove(event))
	}
}
