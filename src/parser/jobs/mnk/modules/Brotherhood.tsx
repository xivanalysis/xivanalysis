import {t, Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import {StatusRoot} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const FULL_PARTY_SIZE = 8

export class Brotherhood extends Analyser {
	static override debug = false
	static override handle = 'brotherhood'
	static override title = t('mnk.bh.title')`Brotherhood`
	static override displayOrder = DISPLAY_ORDER.BROTHERHOOD

	@dependency private checklist!: Checklist
	@dependency private data!: Data

	private brotherhoodBuffTimestamps: number[] = []
	private brotherhoodCastTimestamps: number[] = []
	private brotherhood: StatusRoot['BROTHERHOOD'] = this.data.statuses.BROTHERHOOD

	override initialise() {
		super.initialise()

		const playerCharacters = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)

		this.addEventHook(filter<Event>()
			.type('statusApply')
			.status(this.data.statuses.BROTHERHOOD.id)
			.source(this.parser.actor.id)
			.target(oneOf(playerCharacters)),
		this.onBrotherhoodBuff)

		this.addEventHook(filter<Event>()
			.type('action')
			.action(this.data.actions.BROTHERHOOD.id)
			.source(this.parser.actor.id),
		this.onBrotherhoodAction)

		this.addEventHook(filter<Event>().type('complete'), this.onComplete)
	}

	private onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="mnk.bh.checklist.name">Buff your party</Trans>,
			description: <Trans id="mnk.bh.checklist.desc">
				To maximise raid damage, try to hit all party members with <ActionLink action="BROTHERHOOD"/>.
			</Trans>,
			displayOrder: DISPLAY_ORDER.BROTHERHOOD,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.bh.checklist.req.name"><ActionLink action="BROTHERHOOD"/> buffs</Trans>,
					value: this.totalAffectedPlayers(),
					target: this.maxPossibleTargets(),
				}),
			],
			target: 95,
		}))
	}

	private maxPossibleTargets(): number {
		return this.brotherhoodCastTimestamps.length * FULL_PARTY_SIZE
	}

	private totalAffectedPlayers(): number {
		return this.brotherhoodCastTimestamps.map(bhTimestamp => this.affectedPlayers(bhTimestamp))
			.reduce((previousValue, currentValue) => previousValue + currentValue, 0)
	}

	private affectedPlayers(castTimestamp: number): number {
		return this.brotherhoodBuffTimestamps.filter(buffTimestamp => Math.abs(castTimestamp - buffTimestamp) < this.brotherhood.duration).length
	}

	private onBrotherhoodBuff(event: Events['statusApply']) {
		this.brotherhoodBuffTimestamps.push(event.timestamp)
	}

	private onBrotherhoodAction(event: Events['action']) {
		this.brotherhoodCastTimestamps.push(event.timestamp)
	}
}
