import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

interface BrotherhoodWindow {
	start: number
	end?: number
	targetsHit: number
}

export class Brotherhood extends Analyser {
	static override debug = false
	static override handle = 'brotherhood'
	static override title = t('mnk.bh.title')`Brotherhood`
	static override displayOrder = DISPLAY_ORDER.BROTHERHOOD

	@dependency private checklist!: Checklist
	@dependency private data!: Data

	private windows: BrotherhoodWindow[] = []
	private playerCharacters: string[] = []

	override initialise() {
		super.initialise()

		this.playerCharacters = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)

		this.addEventHook(filter<Event>()
			.type('statusApply')
			.status(this.data.statuses.BROTHERHOOD.id)
			.source(this.parser.actor.id)
			.target(oneOf(this.playerCharacters)),
		this.onApply)

		this.addEventHook(filter<Event>()
			.type('statusRemove')
			.status(this.data.statuses.MEDITATIVE_BROTHERHOOD.id)
			.source(this.parser.actor.id)
			.target(this.parser.actor.id),
		this.onRemove)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		this.debug(this.windows)

		this.checklist.add(new Rule({
			name: <Trans id="mnk.bh.checklist.name">Buff your party</Trans>,
			description: <Trans id="mnk.bh.checklist.description">
				To maximise raid damage, try to hit all party members with <ActionLink action="BROTHERHOOD"/>.
			</Trans>,
			displayOrder: DISPLAY_ORDER.BROTHERHOOD,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.bh.checklist.requirement.name"><ActionLink action="BROTHERHOOD"/> buffs</Trans>,
					value: this.totalAffectedPlayers(),
					target: this.maxPossibleTargets(),
				}),
			],
			target: 95,
		}))
	}

	private maxPossibleTargets(): number {
		return this.windows.length * this.playerCharacters.length
	}

	private totalAffectedPlayers(): number {
		return this.windows.map(window => window.targetsHit)
			.reduce((previousValue, currentValue) => previousValue + currentValue, 0)
	}

	private onApply(event: Events['statusApply']) {
		const lastWindow = _.last(this.windows)
		if (lastWindow == null || lastWindow.end != null) {
			this.windows.push({
				targetsHit: 1,
				start: event.timestamp,
			})
			return
		}

		lastWindow.targetsHit += 1
	}

	private onRemove(event: Events['statusRemove']) {
		const lastWindow = _.last(this.windows)
		if (lastWindow == null) {
			return
		}

		lastWindow.end = event.timestamp
	}
}
