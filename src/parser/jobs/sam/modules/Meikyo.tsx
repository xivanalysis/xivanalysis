import {t, Trans} from '@lingui/macro'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {Action} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffWindowModule, BuffWindowState} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'

// Set for stuff to ignore TODO: revisit this and get it to show iaijutsu properly
// const IGNORE_THIS = new Set([ACTIONS.MIDARE_SETSUGEKKA.id, ACTIONS.TENKA_GOKEN.id, ACTIONS.HIGANBANA.id, ACTIONS.KAESHI_SETSUGEKKA.id, ACTIONS.KAESHI_GOKEN.id, ACTIONS.KAESHI_HIGANBANA])
const ONLY_SHOW = new Set([ACTIONS.HAKAZE.id, ACTIONS.JINPU.id, ACTIONS.ENPI.id, ACTIONS.SHIFU.id, ACTIONS.FUGA.id, ACTIONS.GEKKO.id, ACTIONS.MANGETSU.id, ACTIONS.KASHA.id, ACTIONS.OKA.id, ACTIONS.YUKIKAZE.id])
const SEN_GCDS = 3

// A set const for SAM speed with 0 speed and shifu up, not sure I like this idea tbh but Aza requested it.
// GCD = 2.18
const SAM_BASE_GCD_SPEED_BUFFED = 2180

export default class MeikyoShisui extends BuffWindowModule {
	static handle = 'Meikyo'
	static title = t('sam.ms.title')`Meikyo Shisui Windows`

	buffAction = ACTIONS.MEIKYO_SHISUI
	buffStatus = STATUSES.MEIKYO_SHISUI

expectedGCDs = {
	expectedPerWindow: SEN_GCDS,
	suggestionContent: <Trans id="sam.ms.suggestions.missedgcd.content">
			Try to land 3 GCDs during every <ActionLink {...ACTIONS.MEIKYO_SHISUI} /> window. </Trans>,
	severityTiers: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

requiredGCDs = {
	icon: ACTIONS.MEIKYO_SHISUI.icon,
	actions: [
		// Single Target
		ACTIONS.GEKKO,
		ACTIONS.KASHA,
		ACTIONS.YUKIKAZE,

		// AoE
		ACTIONS.OKA,
		ACTIONS.MANGETSU,
	],
	suggestionContent: <Trans id="sam.ms.suggestions.badgcd.content">
			GCDs used during <ActionLink {...ACTIONS.MEIKYO_SHISUI}/> should be limited to sen building skills. </Trans>,
	severityTiers: {
		1: SEVERITY.MAJOR,
	},

}

// override for consider action.

considerAction(action: Action) {

	if (ONLY_SHOW.has(action.id)) {
		return true
	}
	return false

}

// override for end of fight reducing

reduceExpectedGCDsEndOfFight(buffWindow: BuffWindowState): number  {
		let reduceGCDsBy = 0

		// Check to see if this window is rushing due to end of fight - reduce expected GCDs accordingly
		const windowDurationMillis = this.buffStatus.duration * 1000
		const fightTimeRemaining = this.parser.pull.duration - (buffWindow.start - this.parser.eventTimeOffset)

		if (windowDurationMillis >= fightTimeRemaining) {
			// This is using floor instead of ceiling to grant some forgiveness to first weave slot casts at the cost of 2nd weaves might be too forgiven
			const possibleGCDs = Math.floor(fightTimeRemaining / SAM_BASE_GCD_SPEED_BUFFED)

			if (possibleGCDs < SEN_GCDS) {
				reduceGCDsBy += (SEN_GCDS - possibleGCDs)
			}
		}

		return reduceGCDsBy
}

}
