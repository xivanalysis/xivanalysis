import {Trans} from '@lingui/react'
import {StatusLink} from 'components/ui/DbLink'
import {StatusRoot} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'

// Give a use time of 5m10s between each potion use
const TIME_BETWEEN_POTIONS_IN_MS = 310000

export class WellPrepared extends Analyser {
	static override handle = 'wellprepared'
	static override debug = true

	@dependency protected checklist!: Checklist
	@dependency protected data!: Data

	private wellFed: StatusRoot['WELL_FED'] = this.data.statuses.WELL_FED
	private medicated: StatusRoot['MEDICATED'] = this.data.statuses.MEDICATED
	private isWellFed: boolean = false
	private potionUses: number = 0

	override initialise() {
		this.addEventHook(filter<Event>().type('actorUpdate').actor(this.parser.actor.id), this.onPull)
		this.addEventHook(filter<Event>().type('statusApply').source(this.parser.actor.id)
			.status(this.medicated.id), this.onPotionUse)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		this.debug(this.isWellFed)
		this.debug(this.potionUses)
		this.debug(this.parser.pull.duration)
		this.debug(this.parser.pull.duration / TIME_BETWEEN_POTIONS_IN_MS)
		this.debug(Math.floor(this.parser.pull.duration / TIME_BETWEEN_POTIONS_IN_MS))
		this.checklist.add(new Rule({
			name: <Trans id="core.wellprepared.checklist.name">
				Well Prepared
			</Trans>,
			description: <Trans id="core.wellprepared.checklist.description">
				Always be ready to go into combat with food and potions.
			</Trans>,
			requirements: [
				new Requirement({
					name: <StatusLink id={this.wellFed.id}/>,
					value: this.isWellFed ? 1 : 0,
					target: 1,
				}),
				new Requirement({
					name: <StatusLink id={this.medicated.id}/>,
					value: this.potionUses,
					target: Math.ceil(this.parser.pull.duration / TIME_BETWEEN_POTIONS_IN_MS),
				}),
			],
			target: 100,
		}))
	}

	private onPull(event: Events['actorUpdate']) {
		if (event.auras != null) {
			this.isWellFed = event.auras.filter(aura => aura.id === this.wellFed.id).length > 0
			this.potionUses = event.auras.filter(aura => aura.id === this.medicated.id).length
		}
	}

	private onPotionUse() {
		this.potionUses += 1
	}
}
