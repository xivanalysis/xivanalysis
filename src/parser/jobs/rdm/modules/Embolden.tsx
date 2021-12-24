import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {RotationTable} from 'components/ui/RotationTable'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

class EmboldenWindow {
	start: number
	end?: number

	rotation: Array<Events['action']> = []

	playersBuffed: string[] = []
	deathTruncated: boolean = false

	constructor(start: number) {
		this.start = start
	}
}

export class Embolden extends Analyser {
	static override handle = 'embolden'
	static override title = t('rdm.embolden.title')`Embolden`
	static override displayOrder = DISPLAY_ORDER.EMBOLDEN

	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private readonly IGNORE_ACTIONS: number[] = [
		// Only magic damage is affected by Embolden
		this.data.actions.FLECHE.id,
		this.data.actions.CONTRE_SIXTE.id,
		this.data.actions.CORPS_A_CORPS.id,
		this.data.actions.ENGAGEMENT.id,
		this.data.actions.DISPLACEMENT.id,

		// Non-damaging utility
		this.data.actions.ADDLE.id,
		this.data.actions.LUCID_DREAMING.id,
		this.data.actions.MAGICK_BARRIER.id,
		this.data.actions.SURECAST.id,
	]

	private history: EmboldenWindow[] = []

	override initialise() {
		const playerCharacters = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)

		this.addEventHook(filter<Event>()
			.type('statusApply')
			.status(this.data.statuses.EMBOLDEN_SELF.id)
			.target(this.parser.actor.id),
		this.buffApplied)

		this.addEventHook(filter<Event>()
			.type('statusRemove')
			.target(this.parser.actor.id)
			.status(this.data.statuses.EMBOLDEN_SELF.id),
		this.buffRemoved)

		this.addEventHook(filter<Event>()
			.type('statusApply')
			.status(this.data.statuses.EMBOLDEN_PARTY.id)
			.source(this.parser.actor.id)
			.target(oneOf(playerCharacters)),
		this.buffApplied)

		this.addEventHook(filter<Event>().type('action').source(this.parser.actor.id), this.onCast)
	}

	private buffApplied(event: Events['statusApply']) {
		const lastWindow: EmboldenWindow = this.tryOpenWindow(event)

		// Count how many players we hit with the buff.
		if (!lastWindow.playersBuffed.includes(event.target)) {
			lastWindow.playersBuffed.push(event.target)
		}
	}

	// Get the existing open buff window, or open a new one
	private tryOpenWindow(event: Events['statusApply']): EmboldenWindow {
		const lastWindow: EmboldenWindow | undefined = _.last(this.history)
		if (lastWindow != null && lastWindow.end == null) {
			return lastWindow
		}

		const newWindow = new EmboldenWindow(event.timestamp)
		this.history.push(newWindow)
		return newWindow
	}

	private buffRemoved(event: Events['statusRemove']) {
		const lastWindow: EmboldenWindow | undefined = _.last(this.history)
		if (lastWindow == null) {
			return
		}

		lastWindow.end = event.timestamp
	}

	private onCast(event: Events['action']) {
		const lastWindow: EmboldenWindow | undefined = _.last(this.history)
		if (lastWindow == null || lastWindow.end != null) {
			return
		}

		const action = this.data.getAction(event.action)
		if (action != null && !this.IGNORE_ACTIONS.includes(action.id)) {
			lastWindow.rotation.push(event)
		}
	}

	override output() {
		const tableData = this.history.map(window => {
			const start = window.start - this.parser.pull.timestamp
			const end = window.end != null ?
				window.end - this.parser.pull.timestamp :
				start

			return ({
				start,
				end,
				rotation: window.rotation,
				targetsData: {
					buffed: {
						actual: window.playersBuffed.length,
						expected: 8,
					},
				},
			})
		})

		return <Fragment>
			<RotationTable
				targets={[
					{
						header: <Trans id="rdm.embolden.rotation-table.header.buffed">Players Buffed</Trans>,
						accessor: 'buffed',
					},
				]}
				data={tableData}
				onGoto={this.timeline.show}
			/>
		</Fragment>
	}
}
