import {Trans} from '@lingui/react'
import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'
import React from 'react'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		'ARCANE_CIRCLE',
		'ENSHROUD',
		{
			label: <Trans id="rpr.actiontimeline.lemure">Lemure</Trans>,
			content: ['LEMURES_SLICE', 'LEMURES_SCYTHE'],
		},
		{
			label: <Trans id="rpr.actiontimeline.bloodstalk">Blood Stalk</Trans>,
			content: ['BLOOD_STALK', 'GRIM_SWATHE', 'UNVEILED_GALLOWS', 'UNVEILED_GIBBET'],
		},
		'GLUTTONY',
		{
			// Ingress and Egress share a CDG - we don't need to specify both to combine.
			label: <Trans id="rpr.actiontimeline.movement">Movement</Trans>,
			content: ['HELLS_INGRESS', 'REGRESS'],
		},
		'ARCANE_CREST',
	]
}
