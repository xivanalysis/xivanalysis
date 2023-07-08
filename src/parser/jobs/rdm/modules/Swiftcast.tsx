import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {BASE_GCD} from 'data/CONSTANTS'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Downtime from 'parser/core/modules/Downtime'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'

export class Swiftcast extends CoreSwiftcast {
	static override displayOrder = DISPLAY_ORDER.SWIFTCAST

	@dependency private downtime!: Downtime
	@dependency private actors!: Actors

	// If Swiftcast and Acceleration are both up, these actions consume Acceleration first.
	private accelerationActions: Action[] = [
		this.data.actions.VERTHUNDER_III,
		this.data.actions.VERAERO_III,
		this.data.actions.IMPACT,
	]

	override isSwiftActionValid(window: HistoryEntry<EvaluatedAction[]>, action: EvaluatedAction): boolean {
		return false
	}

	override considerSwiftAction(action: Action): boolean {
		// We want to inspect the cast time to determine if the player was allowed to use SwiftCast or not
		const castTime = action?.castTime ?? 0
		if (castTime > 0) {
			// Ignore acceleration actions since they won't consume Swiftcast when you have Acceleration.
			if (this.actors.current.hasStatus(this.data.statuses.ACCELERATION.id) && this.accelerationActions.includes(action)) {
				return false
			}
			// Then it had to be VerRaise, VerAero III, or VerThunder III or we were in downtime so it's valid
			return true
		}
		// Use the default behaviour if we've gotten back no cast time
		return super.considerSwiftAction(action)
	}
	override suggestionContent = <Trans id="rdm.swiftcast.suggestion.content">Spells used while <DataLink status="SWIFTCAST"/> is up should be limited to <DataLink action="VERAERO_III"/>, <DataLink action="VERTHUNDER_III"/>, or <DataLink action="VERRAISE"/></Trans>
}
