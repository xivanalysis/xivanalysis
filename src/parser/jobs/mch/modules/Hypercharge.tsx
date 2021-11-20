import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import React, {Fragment} from 'react'
import {Message, Accordion} from 'semantic-ui-react'

const HYPERCHARGE_DURATION_MS = 8000
const HYPERCHARGE_GCD_TARGET = 5
const HYPERCHARGE_GCD_WARNING = 4
const HYPERCHARGE_GCD_ERROR = 0

export class Hypercharge extends Analyser {
	static override handle = 'hypercharge'
	static override title = t('mch.hypercharge.title')`Hypercharge Windows`

	@dependency private data!: Data

	private history: History<Array<Events['action']>> = new History(() => [])
	private rotationHook: EventHook<Events['action']> | undefined

	override initialise() {
		const hyperchargeFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.HYPERCHARGE.id)

		this.addEventHook(hyperchargeFilter, this.onHypercharge)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.endCurrentWindow)
		this.addEventHook('complete', this.endCurrentWindow)
	}

	private endCurrentWindow(event: Event) {
		if (this.rotationHook) {
			this.removeEventHook(this.rotationHook)
			this.rotationHook = undefined
		}

		this.history.closeCurrent(event.timestamp)
	}

	private onHypercharge(event: Events['action']) {
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

		if (event.timestamp > currentWindow.start + HYPERCHARGE_DURATION_MS) {
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

	override output() {
		if (this.history.entries.length === 0) { return }

		const panels = this.history.entries.map(window => {
			const gcdCount = window.data
				.map(cast => this.data.getAction(cast.action))
				.filter(action => action?.onGcd)
				.length

			return {
				title: {
					key: 'title-' + window.start,
					content: <Fragment>
						{this.parser.formatEpochTimestamp(window.start)}
						<span> - </span>
						{this.formatGcdCount(gcdCount)} / {HYPERCHARGE_GCD_TARGET} <Plural id="mch.hypercharge.panel-count" value={window.data.length} one="GCD" other="GCDs"/>
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
				<Trans id="mch.hypercharge.accordion.message">Every overheat window should ideally include {HYPERCHARGE_GCD_TARGET} casts of <ActionLink {...this.data.actions.HEAT_BLAST}/> and enough casts of <ActionLink {...this.data.actions.GAUSS_ROUND}/> and <ActionLink {...this.data.actions.RICOCHET}/> to avoid overcapping their charges. If you clip a lot while weaving, overcapping is still preferable to dropping a Heat Blast. Each overheat window below indicates how many GCDs it contained and will display all the casts in the window if expanded.</Trans>
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
