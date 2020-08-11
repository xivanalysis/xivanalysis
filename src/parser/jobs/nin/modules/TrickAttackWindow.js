import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'

// Opener has 5 Ninjutsu + 3 weaponskills, non-TCJ windows will likely have 2-3 Ninjutsu + 4-5 weaponskills
const BASE_GCDS_PER_WINDOW = 7

const FIRST_WINDOW_BUFFER = 30000

const MUDRAS = [
	ACTIONS.TEN.id,
	ACTIONS.TEN_NEW.id,
	ACTIONS.CHI.id,
	ACTIONS.CHI_NEW.id,
	ACTIONS.JIN.id,
	ACTIONS.JIN_NEW.id,
]

export default class TrickAttackWindow extends BuffWindowModule {
	static handle = 'taWindow'
	static title = t('nin.taWindow.title')`Trick Attack Windows`

	buffAction = ACTIONS.TRICK_ATTACK
	buffStatus = STATUSES.TRICK_ATTACK_VULNERABILITY_UP

	rotationTableNotesColumnHeader = <Trans id ="nin.taWindow.chart.notes.header">TCJ Used</Trans>

	expectedGCDs = {
		expectedPerWindow: BASE_GCDS_PER_WINDOW,
		suggestionContent: <Trans id="nin.taWindow.suggestions.gcds.content">
			While the exact number of GCDs per window will vary depending on whether <ActionLink {...ACTIONS.TEN_CHI_JIN}/> is up, every <ActionLink {...ACTIONS.TRICK_ATTACK}/> window should contain at least {BASE_GCDS_PER_WINDOW} GCDs.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
			2: SEVERITY.MAJOR,
		},
	}

	trackedActions = {
		icon: ACTIONS.TRICK_ATTACK.icon,
		actions: [
			{
				action: ACTIONS.SHADOW_FANG,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.HYOSHO_RANRYU,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.RAITON,
				expectedPerWindow: 2,
			},
			{
				action: ACTIONS.DREAM_WITHIN_A_DREAM,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.ASSASSINATE,
				expectedPerWindow: 1,
			},
		],
		suggestionContent: <Trans id="nin.taWindow.suggestions.trackedactions.content">
			Every <ActionLink {...ACTIONS.TRICK_ATTACK}/> window should contain <ActionLink {...ACTIONS.SHADOW_FANG}/>, <ActionLink {...ACTIONS.HYOSHO_RANRYU}/>, 2 <ActionLink {...ACTIONS.RAITON}/> casts (or 1 if it's your opener), and <ActionLink {...ACTIONS.DREAM_WITHIN_A_DREAM}/> in order to maximize damage.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		},
	}

	trackedBadActions = {
		icon: ACTIONS.ARMOR_CRUSH.icon,
		actions: [
			{
				action: ACTIONS.ARMOR_CRUSH,
				expectedPerWindow: 0,
			},
		],
		suggestionContent: <Trans id="nin.taWindow.suggestions.badtrackedactions.content">
			Avoid using <ActionLink {...ACTIONS.ARMOR_CRUSH}/> under <ActionLink {...ACTIONS.TRICK_ATTACK}/> unless <ActionLink {...ACTIONS.HUTON}/> is about to fall off or you can only hit the flank positional, as <ActionLink {...ACTIONS.AEOLIAN_EDGE}/> is otherwise a higher potency finisher.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
		},
	}

	init() {
		super.init()
		this.addEventHook('normalisedapplydebuff', {by: 'player'}, this.onApplyBuff)
		this.addEventHook('normalisedremovedebuff', {by: 'player'}, this.onRemoveBuff)
	}

	considerAction(action) {
		// Ten, Chi, and Jin should be ignored for purposes of GCD counts
		return MUDRAS.indexOf(action.id) === -1
	}

	changeExpectedGCDsClassLogic(buffWindow) {
		return buffWindow.rotation.find(cast => cast.ability.guid === ACTIONS.TEN_CHI_JIN.id) ? 1 : 0
	}

	changeExpectedTrackedActionClassLogic(buffWindow, action) {
		if (action.action.id === ACTIONS.RAITON.id && buffWindow.start - this.parser.fight.start_time < FIRST_WINDOW_BUFFER) {
			return -1
		}

		return 0
	}

	getBuffWindowNotes(buffWindow) {
		return buffWindow.rotation.find(cast => cast.ability.guid === ACTIONS.TEN_CHI_JIN.id) ?
			<Trans id="nin.taWindow.chart.notes.yes">Yes</Trans> : <Trans id="nin.taWindow.chart.notes.no">No</Trans>
	}
}
