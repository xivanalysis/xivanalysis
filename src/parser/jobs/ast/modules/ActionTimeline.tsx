import {Trans} from '@lingui/macro'
import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'
import React from 'react'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		//other AST or party buffs
		['DIVINATION', 'ORACLE'],
		'LIGHTSPEED',
		// Arcanum
		{
			label: <Trans id="ast.actiontimeline.draw">Draw</Trans>,
			content: ['ASTRAL_DRAW', 'UMBRAL_DRAW'],
		},
		'PLAY_I',
		'PLAY_II',
		'PLAY_III',
		'MINOR_ARCANA',
		// oGCD ST heals
		'ESSENTIAL_DIGNITY',
		'SYNASTRY',
		'CELESTIAL_INTERSECTION',
		// oGCD AoE heals
		'CELESTIAL_OPPOSITION',
		['EARTHLY_STAR', 'STELLAR_DETONATION'],
		//Delayed oGCD Heals
		['MACROCOSMOS', 'MICROCOSMOS'],
		'EXALTATION',
		['HOROSCOPE', 'HOROSCOPE_ACTIVATION'],
		// Healing buff
		'NEUTRAL_SECT',
		// Party mitigation
		'COLLECTIVE_UNCONSCIOUS',
		'SUN_SIGN',
	]
}
