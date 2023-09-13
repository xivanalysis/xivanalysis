import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {StatusLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {RaidBuffWindow} from 'parser/core/modules/ActionWindow'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const OTHER_PET_ACTIONS: ActionKey[] = [
	'INFERNO',
	'EARTHEN_FURY',
	'AERIAL_BLAST',
	'WYRMWAVE',
	'AKH_MORN',
	'EVERLASTING_FLIGHT',
	'SCARLET_FLAME',
	'REVELATION',
]

// Currently, Searing Light will drift relative to the rotation in order to keep demis on cooldown.
// If this changes, it may make sense to convert this to a BuffWindow and call out expected skills.

export class SearingLight extends RaidBuffWindow {
	static override handle = 'searinglight'
	static override title = t('smn.searinglight.title')`Searing Light`
	static override displayOrder = DISPLAY_ORDER.SEARING_LIGHT

	override buffStatus = this.data.statuses.SEARING_LIGHT

	private petIds: string[] = []
	private slPending = false
	private ghosted = 0

	override initialise() {
		super.initialise()

		this.petIds = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)

		const petsFilter = filter<Event>().source(oneOf(this.petIds))

		if (this.parser.patch.before('6.1')) {
			this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.action(this.data.actions.SEARING_LIGHT.id)
					.type('action'),
				this.queueSearingLight)

			this.addEventHook(
				petsFilter.action(this.data.actions.PET_SEARING_LIGHT.id).type('action'),
				this.onBuffGeneratorCast
			)

			this.addEventHook(
				petsFilter.action(this.data.matchActionId(OTHER_PET_ACTIONS)).type('action'),
				this.nonCarbuncleAction,
			)
		}
	}

	private onBuffGeneratorCast() {
		this.slPending = false
	}

	private queueSearingLight() {
		this.slPending = true
	}

	private nonCarbuncleAction() {
		if (!this.slPending) { return }
		this.ghosted++
		this.slPending = false
	}

	override onComplete() {
		super.onComplete()

		if (this.ghosted > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.SEARING_LIGHT.icon,
				content: <Trans id="smn.searinglight.suggestions.ghosted.content">
					Make sure carbuncle has enough time to apply <StatusLink status="SEARING_LIGHT"/> before summoning an Arcanum or demi summon or your cast will be wasted.
				</Trans>,
				why: <Trans id="smn.searinglight.suggestiongs.ghosted.why">
					<Plural value={this.ghosted} one="# Searing Light use was" other="# Searing Light uses were"/> lost.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}
	}
}
