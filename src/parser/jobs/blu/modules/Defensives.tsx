import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// Defensive suggestions are a bit different for each mimicry.
// And since we are already checking for mimicry, add a suggestion
// if they don't have one running!
export class Defensives extends CoreDefensives {
	static override displayOrder = DISPLAY_ORDER.DEFENSIVES

	// Basic defensives are Addle and Magic Hammer.
	// Due to spell slot limitations, not everyone will be carrying Magic Hammer,
	// so later we filter this out of the report if they never used it.
	protected override trackedDefensives = [
		this.data.actions.ADDLE,
		this.data.actions.MAGIC_HAMMER,
	]

	@dependency private suggestions!: Suggestions

	private currentMimicry?: Status['id']
	override initialise() {
		super.initialise()

		// This is missing a million edge cases, like people taking off
		// mimicry mid-pull or turning it on mid-pull.  But it's fine --
		// it should just point out if they had a pull without mimicry
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(oneOf([
			this.data.statuses.MIMICRY_TANK.id,
			this.data.statuses.MIMICRY_HEALER.id,
			this.data.statuses.MIMICRY_DPS.id,
		])), this.onApplyMimicry)

		this.addEventHook('complete', this.onCompleteDefensives)
	}

	private onApplyMimicry(event: Events['statusApply']) {
		this.currentMimicry = event.status
	}

	private onCompleteDefensives() {
		// Filter out Magic Hammer if they never used it -- Assume that they just didn't
		// have it slotted.
		if (this.getUses(this.data.actions.MAGIC_HAMMER).length === 0) {
			const index = this.trackedDefensives.indexOf(this.data.actions.MAGIC_HAMMER)
			this.trackedDefensives.splice(index, 1)
		}

		switch (this.currentMimicry) {
		case this.data.statuses.MIMICRY_TANK.id:
			this.trackedDefensives.push(
				this.data.actions.DRAGON_FORCE,
				this.data.actions.CHELONIAN_GATE,
				this.data.actions.DEVOUR,
			)
			break
		case this.data.statuses.MIMICRY_HEALER.id:
			this.trackedDefensives.push(this.data.actions.ANGELS_SNACK)
			break
		case this.data.statuses.MIMICRY_DPS.id:
			// DPSes just get Addle and possibly Magic Hammer.
			break
		default:
			// No mimicry at all!  This is the first time I would genuinely argue for a
			// "Morbid" severity -- essentially missing a 20% damage buff that lasts the
			// entire fight and requires zero resources or upkeep.
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.AETHERIAL_MIMICRY.icon,
				content: <Trans id="blu.mimicry_missing.content">
					You did not have any <DataLink action="AETHERIAL_MIMICRY"/> stance on.  This is free damage!
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blu.mimicry_missing.why">You should always have this.</Trans>,
			}))
			break
		}
	}
}
