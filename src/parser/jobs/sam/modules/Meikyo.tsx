import {t, Trans} from '@lingui/macro'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Action} from 'data/ACTIONS/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Status} from 'data/STATUSES/STATUSES'
import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'

	// Set for stuff to ignore TODO: revisit this and get it to show iaijutsu properly
	// const IGNORE_THIS = new Set([ACTIONS.MIDARE_SETSUGEKKA.id, ACTIONS.TENKA_GOKEN.id, ACTIONS.HIGANBANA.id, ACTIONS.KAESHI_SETSUGEKKA.id, ACTIONS.KAESHI_GOKEN.id, ACTIONS.KAESHI_HIGANBANA])
const ONLY_SHOW = new Set([ACTIONS.HAKAZE.id, ACTIONS.JINPU.id, ACTIONS.ENPI.id, ACTIONS.SHIFU.id, ACTIONS.FUGA.id, ACTIONS.GEKKO.id, ACTIONS.MANGETSU.id, ACTIONS.KASHA.id, ACTIONS.OKA.id, ACTIONS.YUKIKAZE.id])

export default class MeikyoShisui extends BuffWindowModule {
	static handle = 'Meikyo'
	static title = t('sam.ms.title')`Meikyo Shisui Windows`

	buffAction = ACTIONS.MEIKYO_SHISUI
	buffStatus = STATUSES.MEIKYO_SHISUI

expectedGCDs = {
		expectedPerWindow: 3,
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
			} else {
				return false
			}
	}
}
