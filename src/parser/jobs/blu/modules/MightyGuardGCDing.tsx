import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export class MightyGuardGCDing extends Analyser {
	static override handle = 'mightyguard'
	static override title = t('blu.mighty_guard.title')`Mighty Guard`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private hasTankMimickry = false
	private damagingActionsUnderMG = 0
	private currentHook?: EventHook<Events['action']>

	override initialise() {
		super.initialise()
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		const tankMimickryFilter = playerFilter.status(this.data.statuses.MIMICRY_TANK.id)
		this.addEventHook(tankMimickryFilter.type('statusApply'), this.onApplyTankMimickry)
		this.addEventHook(tankMimickryFilter.type('statusRemove'), this.onRemoveTankMimickry)

		const mightyGuardFilter = playerFilter.status(this.data.statuses.MIGHTY_GUARD.id)
		this.addEventHook(mightyGuardFilter.type('statusApply'), this.onApplyMightyGuard)
		this.addEventHook(mightyGuardFilter.type('statusRemove'), this.onRemoveMightyGuard)

		this.addEventHook('complete', this.onComplete)
	}

	private onApplyTankMimickry() {
		this.hasTankMimickry = true
	}
	private onRemoveTankMimickry() {
		this.hasTankMimickry = false
	}

	private onApplyMightyGuard() {
		if (this.currentHook !== undefined) { return }
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.currentHook = this.addEventHook(playerFilter.type('action'), this.onActionWithStance)
	}

	private onRemoveMightyGuard() {
		if (this.currentHook !== undefined) {
			this.removeEventHook(this.currentHook)
		}
	}

	private onActionWithStance(event: Events['action']) {
		// If they have tank mimicry, we expect them to have MG up.  If they want to stance
		// dance, all the glory to them.
		if (this.hasTankMimickry) { return }

		// No mimicry. See if this was a damaging action
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		// All the damaging BLU actions have a damage type, since that's how we detect
		// if they are buffed by Peculiar Light.
		// So if there's no damageType, it's not a damaging action.
		if (action.damageType === undefined) { return }

		// Damaging action under MG. Count it!
		this.damagingActionsUnderMG++
	}

	private onComplete() {
		const gcds = this.damagingActionsUnderMG
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.MIGHTY_GUARD.icon,
			content: <Trans id="blu.mighty_guard.gcds.content">
				<DataLink action="MIGHTY_GUARD"/> comes with a significant damage penalty. If you don't need the damage mitigation to survive a mechanic, turn it off!
			</Trans>,
			tiers: {1: SEVERITY.MINOR},
			value: gcds,
			why: <Trans id="blu.mighty_guard.gcds.why">
				<Plural value={gcds} one="# damaging GCD was" other="# damaging GCDs were" /> cast under <DataLink action="MIGHTY_GUARD" showIcon={false} />
			</Trans>,
		}))
	}
}
