import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Swiftcast extends CoreSwiftcast {
	static override displayOrder = DISPLAY_ORDER.SWIFTCAST

	@dependency private actors!: Actors

	private accelerationActions: Action[] = [
		this.data.actions.VERTHUNDER_III,
		this.data.actions.VERAERO_III,
		this.data.actions.IMPACT,
	]

	private badSwiftcastSpells: Action[] = [
		this.data.actions.JOLT,
		this.data.actions.JOLT_II,
		this.data.actions.VERTHUNDER_II,
		this.data.actions.VERAERO_II,
		this.data.actions.VERFIRE,
		this.data.actions.VERSTONE,
	]

	private badSwiftValidator = (window: HistoryEntry<EvaluatedAction[]>) => {
		if (window.data.length > 0 && this.badSwiftcastSpells.includes(window.data[0].action)) {
			return {
				isValid: false,
				note: <Trans id="rdm.swiftcast.table.note.bad">Swiftcast used on a suboptimal spell</Trans>,
			}
		}

		return {isValid: true}
	}

	override swiftcastValidators = [this.badSwiftValidator]

	override considerSwiftAction(action: Action): boolean {
		const castTime = action.castTime ?? 0

		if (castTime > 0) {
			// Ignore spells that get consumed by Acceleration / Dualcast before Swiftcast
			const hasAcceleration = this.actors.current.hasStatus(this.data.statuses.ACCELERATION.id) && this.accelerationActions.includes(action)
			const hasDualcast = this.actors.current.hasStatus(this.data.statuses.DUALCAST.id)
			return !(hasAcceleration || hasDualcast)
		}

		// Use the default behaviour if no cast time
		return super.considerSwiftAction(action)
	}

	override suggestionContent = <Trans id="rdm.swiftcast.suggestion.content">Spells used while <DataLink status="SWIFTCAST"/> is up should be limited to <DataLink action="VERAERO_III"/>, <DataLink action="VERTHUNDER_III"/>, <DataLink action="IMPACT"/>, and <DataLink action="VERRAISE"/>.</Trans>
}
