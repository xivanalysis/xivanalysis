import {Trans} from '@lingui/react'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// Annoyingly we can't directly use the Swiftcast
export class Swiftcast extends CoreSwiftcast {
	static override displayOrder = DISPLAY_ORDER.SWIFTCAST
	private badSwiftValidator = (window: HistoryEntry<EvaluatedAction[]>) => {
		if (window.data.length <= 0) {
			return {isValid: true}
		}

		// Swifting a Moon Flute is bizarrely a significant loss!
		// Normally casting Moon Flute gives you 14.5s worth of GCDs under
		// Waxing Nocturne, because you get the effect when the spell
		// finishes casting.
		//
		// Swifting the Moon Flute cast gives you the effect immediately,
		// leaving you with 12.5s worth of Moon Flute for GCDs.
		if (window.data[0].action !== this.data.actions.MOON_FLUTE) {
			return {isValid: true}
		}

		// Edge case: It's the end of the fight and you're swifting MF to
		// fit in some extra oGCDs.
		// I guess there's some optimization cases before downtime too?
		// We consider Waning Nocturne as downtime so checking that is going
		// be really annoying. Assume they know what they're doing.
		const timeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
		if (timeRemaining <= this.data.statuses.WAXING_NOCTURNE.duration) {
			return {isValid: true}
		}

		return {
			isValid: false,
			note: <Trans id="blu.swiftcast.table.note.bad-mf">Swiftcasting Moon Flute will lose you a damaging GCD</Trans>,
		}
	}
	override swiftcastValidators = [this.badSwiftValidator]
}

