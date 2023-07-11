import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Message, Accordion, Button} from 'semantic-ui-react'

const HYPERCHARGE_DURATION_PATCH_600 = 8000
const HYPERCHARGE_DURATION_PATCH_630 = 10000
const HYPERCHARGE_GCD_TARGET = 5
const HYPERCHARGE_GCD_WARNING = 4
const HYPERCHARGE_GCD_ERROR = 0

const HYPERCHARGE_GCDS: ActionKey[] = [
	'HEAT_BLAST',
	'AUTO_CROSSBOW',
]

export class Hypercharge extends Analyser {
	static override handle = 'hypercharge'
	static override title = t('mch.hypercharge.title')`Hypercharge Windows`

	@dependency private data!: Data
	@dependency private timeline!: Timeline

	private history: History<Array<Events['action']>> = new History(() => [])
	private rotationHook: EventHook<Events['action']> | undefined
	private hyperchargeGcds = HYPERCHARGE_GCDS.map(key => this.data.actions[key].id)
	private hyperchargeDuration = this.parser.patch.before('6.3')
		? HYPERCHARGE_DURATION_PATCH_600
		: HYPERCHARGE_DURATION_PATCH_630

	override initialise() {
		const hyperchargeFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.HYPERCHARGE.id)

		const overheatedFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('statusRemove')
			.status(this.data.statuses.OVERHEATED.id)

		this.addEventHook(hyperchargeFilter, this.onHypercharge)
		this.addEventHook(overheatedFilter, this.endCurrentWindow)
		this.addEventHook('complete', this.endCurrentWindow)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.endCurrentWindow)
	}

	private endCurrentWindow(event: Event) {
		if (this.rotationHook) {
			this.removeEventHook(this.rotationHook)
			this.rotationHook = undefined
		}

		this.history.closeCurrent(event.timestamp)
	}

	private onHypercharge(event: Events['action']) {
		this.endCurrentWindow(event)

		this.rotationHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action'),
			this.onCast
		)

		this.history.openNew(event.timestamp)
	}

	private onCast(event: Events['action']) {
		const currentWindow = this.history.getCurrent()

		if (currentWindow == null) { return }

		if (event.timestamp > currentWindow.start + this.hyperchargeDuration) {
			this.endCurrentWindow(event)
			return
		}

		currentWindow.data.push(event)
	}

	private formatGcdCount(count: number) {
		if (count === HYPERCHARGE_GCD_ERROR) {
			return <span className="text-error">{count}</span>
		}

		if (count <= HYPERCHARGE_GCD_WARNING) {
			return <span className="text-warning">{count}</span>
		}

		return count
	}

	private createTimelineButton = (timestamp: number) => (
		<Button
			circular
			compact
			icon="time"
			size="mini"
			onClick={() => this.timeline.show(timestamp - this.parser.pull.timestamp, timestamp - this.parser.pull.timestamp)}
			content={this.parser.formatEpochTimestamp(timestamp)}
		/>
	)

	override output() {
		if (this.history.entries.length === 0) { return }

		const panels = this.history.entries.map(window => {
			const hyperchargeGcdCount = window.data
				.filter(cast => this.hyperchargeGcds.includes(cast.action))
				.length

			return {
				title: {
					key: 'title-' + window.start,
					content: <Fragment>
						{this.createTimelineButton(window.start)}
						{' '}
						{this.formatGcdCount(hyperchargeGcdCount)} / {HYPERCHARGE_GCD_TARGET} <Plural id="mch.hypercharge.panel-count" value={window.data.length} one="Hypercharge GCD" other="Hypercharge GCDs"/>
					</Fragment>,
				},
				content: {
					key: 'content-' + window.start,
					content: <Rotation events={window.data} />,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="mch.hypercharge.accordion.message">Every Hypercharge window should ideally include {HYPERCHARGE_GCD_TARGET} casts of <DataLink action="HEAT_BLAST" /> or <DataLink action="AUTO_CROSSBOW" /> and enough casts of <DataLink action="GAUSS_ROUND" /> and <DataLink action="RICOCHET" /> to avoid overcapping their charges. If you clip a lot while weaving, overcapping is still preferable to dropping a Hypercharge GCD. Each Hypercharge window below indicates how many GCDs it contained and will display all the casts in the window if expanded.</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</Fragment>
	}
}
