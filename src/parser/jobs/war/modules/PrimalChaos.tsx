import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

const DROPSY_STATUSES: StatusKey[] = [
	'NASCENT_CHAOS',
	'PRIMAL_REND_READY',
]

export class PrimalChaos extends Analyser {
	static override handle = 'primalchaos'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private droppedChaos: number = 0
	private droppedRends: number = 0
	private usedChaos: boolean = false
	private usedRend: boolean = false

	private chaosHook?: EventHook<Events['action']>
	private primalHook?: EventHook<Events['action']>

	override initialise() {
		const dropsyStatuses = DROPSY_STATUSES.map(key => this.data.statuses[key].id)

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(oneOf(dropsyStatuses)), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(oneOf(dropsyStatuses)), this.onDrop)
	}

	private onGain(event: Events['statusApply']) {
		switch (event.status) {
		case this.data.statuses.NASCENT_CHAOS.id:
			this.chaosHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action')
					.action(oneOf([this.data.actions.INNER_CHAOS.id, this.data.actions.CHAOTIC_CYCLONE.id])),
				() => this.usedChaos = true,
			)
			break

		case this.data.statuses.PRIMAL_REND_READY.id:
			this.primalHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action')
					.action(this.data.actions.PRIMAL_REND.id),
				() => this.usedRend = true,
			)
			break
		}
	}

	private onDrop(event: Events['statusRemove']) {
		switch (event.status) {
		case this.data.statuses.NASCENT_CHAOS.id:
			if (!this.usedChaos) { this.droppedChaos++ }
			if (this.chaosHook != null) {
				this.removeEventHook(this.chaosHook)
				this.chaosHook = undefined
			}
			this.usedChaos = false
			break

		case this.data.statuses.PRIMAL_REND_READY.id:
			if (!this.usedRend) { this.droppedRends++ }
			if (this.primalHook != null) {
				this.removeEventHook(this.primalHook)
				this.primalHook = undefined
			}
			this.usedRend = false
			break
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.INNER_CHAOS.icon,
			content: <Trans id="">
				Try to consume <DataLink status="NASCENT_CHAOS"/> before it expires, as <DataLink action="INNER_CHAOS"/> and <DataLink action="CHAOTIC_CYCLONE"/> are two of your strongest skills.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: this.droppedChaos,
			why: <Trans id="">
				<DataLink status="NASCENT_CHAOS"/> timed out <Plural value={this.droppedChaos} one="# time" other="# times"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PRIMAL_REND.icon,
			content: <Trans id="">
				Try to consume <DataLink status="PRIMAL_REND_READY"/> before it expires as <DataLink action="PRIMAL_REND"/> is your single strongest skill.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: this.droppedRends,
			why: <Trans id="">
				<DataLink status="PRIMAL_REND_READY"/> timed out <Plural value={this.droppedRends} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
